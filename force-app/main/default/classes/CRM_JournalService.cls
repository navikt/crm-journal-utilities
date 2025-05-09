public without sharing class CRM_JournalService {
    /**
     * @description
     * @author Stian Ruud Schikora | 08-31-2021
     * @param journalRequest
     * @param complete
     * @param navIdent - Identifier of the user posting the journal entry
     * @return HttpResponse
     **/
    public HttpResponse postJournal(CRM_JournalEntryWrapper journalRequest, Boolean complete, String navIdent) {
        return doJournalCallout(journalRequest, complete, navIdent, false);
    }

    private HttpResponse doJournalCallout(
        CRM_JournalEntryWrapper journalRequest,
        Boolean complete,
        String navIdent,
        Boolean hasRetried
    ) {
        ApiController apiCtrl = new ApiController();

        Map<String, String> httpHeaders = new Map<String, String>{ 'Content-Type' => 'application/json' };
        apiCtrl.setLogUuid(new Uuid().getValue());
        httpHeaders.put('Nav-Call-Id', apiCtrl.getLogUuid());
        if (String.isNotBlank(navIdent)) {
            //Adds NAV Ident to request header for traceability in JOARK
            httpHeaders.put('Nav-User-Id', navIdent);
        }

        apiCtrl.initRequest('Journal_API', 'POST_CREATE_JOURNAL');
        apiCtrl.setSystemContext()
            .addServiceAuthHeader('Dokarkiv')
            .addUrlParam('forsoekFerdigstill', String.valueOf(complete))
            .setBody(JSON.serialize(journalRequest, true))
            .setHeaders(httpHeaders);

        apiCtrl.doCallout();
        HttpResponse response = apiCtrl.getResponse();

        if (shouldRetry(response, hasRetried)) {
            return doJournalCallout(journalRequest, complete, navIdent, true);
        }

        return response;
    }

    private Boolean shouldRetry(HttpResponse response, Boolean hasRetried) {
        return !hasRetried && response != null && response.getStatusCode() >= 500 && response.getStatusCode() < 600;
    }
}

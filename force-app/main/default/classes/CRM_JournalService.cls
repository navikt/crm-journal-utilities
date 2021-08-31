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
        ApiController apiCtrl = new ApiController();

        Map<String, String> httpHeaders = new Map<String, String>{ 'Content-Type' => 'application/json' };
        if(String.isNotBlank(navIdent)) {
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

        return apiCtrl.getResponse();
    }
}

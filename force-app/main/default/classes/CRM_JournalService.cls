public without sharing class CRM_JournalService {
    public HttpResponse postJournal(CRM_JournalEntryWrapper journalRequest, Boolean complete) {
        ApiController apiCtrl = new ApiController();

        Map<String, String> httpHeaders = new Map<String, String>{ 'Content-Type' => 'application/json' };
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

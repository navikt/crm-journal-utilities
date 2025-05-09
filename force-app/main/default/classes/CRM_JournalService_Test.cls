@isTest
public class CRM_JournalService_Test {
    @isTest
    static void testJournalPost() {
        ApiMock.setTestMock('POST_CREATE_JOURNAL', 200, 'OK');
        CRM_JournalService service = new CRM_JournalService();

        Test.startTest();
        HttpResponse resp = service.postJournal(new CRM_JournalEntryWrapper(), true, 'Z999999');
        Test.stopTest();

        Assert.areEqual(200, resp.getStatusCode());
    }

    @isTest
    static void testJournalPostError() {
        ApiMock.setTestMock('POST_CREATE_JOURNAL', 500, 'Internal Server Error');
        CRM_JournalService service = new CRM_JournalService();

        Test.startTest();
        HttpResponse response = service.postJournal(new CRM_JournalEntryWrapper(), true, 'Z123456');
        Test.stopTest();

        Assert.areEqual(500, response.getStatusCode());
    }
}

@isTest
public class CRM_NavSakService_Test {
    @isTest
    static void testGetSakNavCases() {
        ApiMock.setTestMock('POST_SAF_CASE_QUERY', 200, 'OK');

        Test.startTest();
        List<CRM_NavSakService.SafCaseWrapper> returnList = CRM_NavSakService.getSafActorCases('12345678910');
        Test.stopTest();

        System.assert(!returnList.isEmpty());
    }

    @isTest
    static void testGetSakNavCasesFail() {
        ApiMock.setTestMock('POST_SAF_CASE_QUERY', 404, 'NOT FOUND');
        List<CRM_NavSakService.SafCaseWrapper> returnList = new List<CRM_NavSakService.SafCaseWrapper>();

        Test.startTest();
        try {
            returnList = CRM_NavSakService.getSafActorCases('12345678910');
        } catch (AuraHandledException ex) {
            //Safely catching the aura handled exception
        }
        Test.stopTest();
        System.assert(returnList.isEmpty());
        System.assert([SELECT COUNT() FROM Application_Log__c] != 0);
    }
}

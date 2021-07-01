@isTest
public class CRM_JournalUtilities_Test {
    @isTest
    static void testDocumentGeneration() {
        String stringToEncode, encodedString;
        stringToEncode = 'THIS IS A TEST';

        CRM_JournalUtilities.utilityRequest utilRequest = new CRM_JournalUtilities.utilityRequest(
            'GENERATE_DOCUMENT',
            stringToEncode,
            null
        );

        Test.startTest();
        utilRequest.requestType = 'GENERATE_DOCUMENT';
        encodedString = CRM_JournalUtilities.handleRequest(
                new List<CRM_JournalUtilities.utilityRequest>{ utilRequest }
            )[0]
            .documentString;
        Test.stopTest();

        System.assertNotEquals(stringToEncode, encodedString);
        System.assertEquals(Blob.toPdf(stringToEncode).size(), EncodingUtil.base64Decode(encodedString).size());
    }

    @isTest
    static void testDocumentGenerationVf() {
        CRM_JournalUtilities.utilityRequest utilRequest = new CRM_JournalUtilities.utilityRequest();
        utilRequest.requestType = 'GENERATE_DOCUMENT';
        utilRequest.visualForceReference = '/apex/testing';

        Test.startTest();
        String encodedString = CRM_JournalUtilities.handleRequest(
                new List<CRM_JournalUtilities.utilityRequest>{ utilRequest }
            )[0]
            .documentString;
        Test.stopTest();

        System.assert(String.isNotBlank(encodedString));
    }

    @isTest
    static void testPostJournal() {
        CRM_JournalEntryWrapper journalRequest = new CRM_JournalEntryWrapper();

        Test.setMock(
            HttpCalloutMock.class,
            new SingleRequestMock(200, 'OK', '{"journalpostId": "3456787", "journalpostferdigstilt": true}', null)
        );

        CRM_JournalUtilities.utilityRequest utilRequest = new CRM_JournalUtilities.utilityRequest(
            'POST_JOURNAL',
            null,
            journalRequest
        );

        Test.startTest();
        String journalPostId = CRM_JournalUtilities.handleRequest(
                new List<CRM_JournalUtilities.utilityRequest>{ utilRequest }
            )[0]
            .journalpostId;
        Test.stopTest();

        System.assertEquals('3456787', journalPostId, 'Incorrect Journal post ID');
    }

    @isTest
    static void testPostJournalError() {
        CRM_JournalEntryWrapper journalRequest = new CRM_JournalEntryWrapper();

        Test.setMock(
            HttpCalloutMock.class,
            new SingleRequestMock(401, 'Unauthorized', '{"statusCode": 401, "message": ERROR}', null)
        );

        CRM_JournalUtilities.utilityRequest utilRequest = new CRM_JournalUtilities.utilityRequest(
            'POST_JOURNAL',
            null,
            journalRequest
        );

        Test.startTest();
        CRM_JournalUtilities.UtilityResponse response = CRM_JournalUtilities.handleRequest(
            new List<CRM_JournalUtilities.utilityRequest>{ utilRequest }
        )[0];
        Test.stopTest();

        System.assertEquals(response.success, false);
        System.assert([SELECT COUNT() FROM Application_Log__c] == 1);
    }
}

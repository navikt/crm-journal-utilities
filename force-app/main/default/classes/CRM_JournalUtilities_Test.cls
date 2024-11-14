@isTest
public class CRM_JournalUtilities_Test {
    @TestSetup
    static void makeData() {
        insert new Journal_Entry__c(Journal_Entry_ID__c = '1234567');
    }

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
    static void testPostJournalDuplicate() {
        CRM_JournalEntryWrapper journalRequest = new CRM_JournalEntryWrapper();

        Test.setMock(
            HttpCalloutMock.class,
            new SingleRequestMock(409, 'Conflict', '{"journalpostId": "1234567", "journalpostferdigstilt": true}', null)
        );

        CRM_JournalUtilities.utilityRequest utilRequest = new CRM_JournalUtilities.utilityRequest(
            'POST_JOURNAL',
            null,
            journalRequest
        );
        utilRequest.referenceId = [SELECT Id FROM Journal_Entry__c LIMIT 1].Id;

        Test.startTest();
        List<CRM_JournalUtilities.UtilityResponse> responses = CRM_JournalUtilities.handleRequest(
            new List<CRM_JournalUtilities.utilityRequest>{ utilRequest }
        );
        Test.stopTest();

        Assert.isTrue(responses[0].duplicate, 'The journal was not accurately marked as duplicate');
    }

    @isTest
    static void testPostJournalDuplicateButFoundNoExistingJEntries() {
        CRM_JournalEntryWrapper journalRequest = new CRM_JournalEntryWrapper();

        Test.setMock(
            HttpCalloutMock.class,
            new SingleRequestMock(409, 'Conflict', '{"journalpostId": "3456787", "journalpostferdigstilt": true}', null)
        );

        CRM_JournalUtilities.utilityRequest utilRequest = new CRM_JournalUtilities.utilityRequest(
            'POST_JOURNAL',
            null,
            journalRequest
        );
        utilRequest.referenceId = [SELECT Id FROM Journal_Entry__c LIMIT 1].Id;

        Test.startTest();
        List<CRM_JournalUtilities.UtilityResponse> responses = CRM_JournalUtilities.handleRequest(
            new List<CRM_JournalUtilities.utilityRequest>{ utilRequest }
        );
        Test.stopTest();

        Assert.isTrue(responses[0].success, 'The response was not accurately set as success');
        Assert.isFalse(responses[0].duplicate, 'Duplicate was incorrectly set to true');
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

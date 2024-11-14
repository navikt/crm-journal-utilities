//Utility class used to allow flow to retrieve the AD token from the session cache
public class CRM_JournalUtilities {
    @InvocableMethod(
        label='Journal Utility Request'
        description='Post journal entry or generate compliant document'
        category='Journal'
    )
    public static List<UtilityResponse> handleRequest(List<utilityRequest> request) {
        List<UtilityResponse> returnList = new List<UtilityResponse>();

        for (UtilityRequest utReq : request) {
            switch on (utReq.requestType) {
                when 'GENERATE_DOCUMENT' {
                    if (String.isNotBlank(utReq.documentString)) {
                        returnList.add(generateDocument(utReq.documentString));
                    } else {
                        //VF generation
                        returnList.add(generateDocumentVf(utReq.visualForceReference));
                    }
                }
                when 'BASE_64_ENCODE' {
                    String document = EncodingUtil.base64Encode(Blob.valueOf(utReq.documentString));
                    returnList.add(new UtilityResponse(true, document, null, null, null));
                }
                when 'POST_JOURNAL' {
                    returnList.add(postJournal(utReq.journalRequest, utReq.referenceId, utReq.navIdent));
                }
            }
        }

        return returnList;
    }

    /**
     * @description: Performs a callout to dokarkiv API to post a journal entry
     * Returns the journalpostId in the utilityResponse upon a successful callout
     * @author Stian Ruud Schikora | 11-24-2020
     * @param journalRequest
     * @return UtilityResponse
     **/
    public static UtilityResponse postJournal(CRM_JournalEntryWrapper journalRequest, Id referenceId, String navIdent) {
        CRM_JournalService service = new CRM_JournalService();
        UtilityResponse resp = new UtilityResponse();

        HttpResponse httpResp = service.postJournal(journalRequest, true, navIdent);

        // Handle Success or Partial Success Responses
        if (httpResp.getStatusCode() == 200 || httpResp.getStatusCode() == 201 || httpResp.getStatusCode() == 409) {
            Map<String, Object> responseMap = (Map<String, Object>) JSON.deserializeUntyped(httpResp.getBody());
            resp.success = true;
            resp.journalpostId = (String) responseMap.get('journalpostId');
            resp.journalPostStatus = ((Boolean) responseMap.get('journalpostferdigstilt'))
                ? 'Completed'
                : 'In Progress';

            // Status 409 is only used when the externalReference we provided for the request has already been used
            if (httpResp.getStatusCode() == 409) {
                List<Journal_Entry__c> existingJEntries = [
                    SELECT CRM_Thread__c, CRM_Conversation_Note__c
                    FROM Journal_Entry__c
                    WHERE Journal_Entry_Id__c = :resp.journalpostId
                    LIMIT 1
                ];
                resp.duplicate =
                    existingJEntries.size() > 0 &&
                    (existingJEntries[0].CRM_Thread__c == referenceId ||
                    existingJEntries[0].CRM_Conversation_Note__c == referenceId);
            }
        } else {
            resp.success = false;
            handleLogging(httpResp, referenceId, resp);
        }

        return resp;
    }

    private static void handleLogging(HttpResponse httpResp, Id referenceId, UtilityResponse resp) {
        LoggerUtility logger = new LoggerUtility('Journal');
        SObject objectRef = String.isNotBlank(referenceId)
            ? referenceId.getSobjectType().newSObject(referenceId)
            : null;
        logger.httpError('Error posting journal entry', httpResp, objectRef, CRM_ApplicationDomain.Domain.NKS);
        String errorRef = logger.peek().UUID__c;
        logger.publish();
        resp.errorMessage = errorRef;
    }

    /**
     * @description: Base 64 encode an input string, used for generating valid document for journal API
     * @author Stian Ruud Schikora | 09-17-2020
     * @param stringToEncode [STRING]
     * @return String
     **/
    public static UtilityResponse generateDocument(String documentString) {
        String document = EncodingUtil.base64Encode(blob.toPdf(documentString));

        return new UtilityResponse(true, document, null, null, null);
    }

    /**
     * @description: Base 64 encode an input string, used for generating valid document for journal API
     * @author Stian Ruud Schikora | 09-17-2020
     * @param stringToEncode [STRING]
     * @return String
     **/
    public static UtilityResponse generateDocumentVf(String vfReference) {
        Pagereference pageRef = new PageReference(vfReference);
        //Test methods do not support getContent calls
        String document = Test.isRunningTest() ? 'TESTING' : EncodingUtil.base64Encode(pageRef.getContentAsPdf());

        return new UtilityResponse(true, document, null, null, null);
    }

    public class utilityRequest {
        public utilityRequest() {
            this.requestType = null;
            this.documentString = null;
            this.visualForceReference = null;
            this.journalRequest = null;
        }

        public utilityRequest(String requestType, String documentString, CRM_JournalEntryWrapper journalRequest) {
            this.requestType = requestType;
            this.documentString = documentString;
            this.journalRequest = journalRequest;
        }

        @invocableVariable(
            label='Type of Apex action to perform (Valid actions are: GENERATE_DOCUMENT, BASE_64_ENCODE and POST_JOURNAL)'
            required=true
        )
        public String requestType;

        @invocableVariable(
            label='(GENERATE_DOCUMENT/BASE_64_ENCODE) Input if document is to be generate based on a string input and converted using blob.toPfd()'
        )
        public String documentString;

        @invocableVariable(
            label='(GENERATE_DOCUMENT) Input if document is to be generated using a visualforce template. /apex/{vfName} + i.e. ?recordId=RECORID_ID to pass url params'
        )
        public String visualForceReference;

        @invocableVariable(label='Reference to salesforce record to be stored on journal entry')
        public Id referenceId;

        @invocableVariable(label='NAV ident of the user posting the journal entry')
        public String navIdent;

        @invocableVariable
        public CRM_JournalEntryWrapper journalRequest;
    }

    public class UtilityResponse {
        @invocableVariable
        public Boolean success;
        @invocableVariable
        public Boolean duplicate;
        @invocableVariable
        public String documentString;
        @invocableVariable
        public String journalpostId;
        @invocableVariable
        public String journalPostStatus;
        @invocableVariable
        public String errorMessage;

        public UtilityResponse() {
            this.success = false;
            this.duplicate = false;
            this.documentString = null;
            this.journalpostId = null;
            this.journalPostStatus = null;
            this.errorMessage = null;
        }

        public UtilityResponse(
            Boolean success,
            String documentString,
            String journalpostId,
            String errorMessage,
            String journalPostStatus
        ) {
            this.success = success;
            this.duplicate = false;
            this.documentString = documentString;
            this.journalpostId = journalpostId;
            this.journalPostStatus = journalPostStatus;
            this.errorMessage = errorMessage;
        }
        public UtilityResponse(
            Boolean success,
            Boolean duplicate,
            String documentString,
            String journalpostId,
            String errorMessage,
            String journalPostStatus
        ) {
            this.success = success;
            this.duplicate = duplicate;
            this.documentString = documentString;
            this.journalpostId = journalpostId;
            this.journalPostStatus = journalPostStatus;
            this.errorMessage = errorMessage;
        }
    }
}

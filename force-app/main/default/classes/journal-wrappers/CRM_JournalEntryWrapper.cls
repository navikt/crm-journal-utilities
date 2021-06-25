global class CRM_JournalEntryWrapper {
    @AuraEnabled
    public String tittel;
    @AuraEnabled
    public String journalpostType;
    @AuraEnabled
    public String tema;
    @AuraEnabled
    public String behandlingstema;
    @AuraEnabled
    public String kanal;
    @AuraEnabled
    public String journalfoerendeEnhet;
    @AuraEnabled
    public CRM_AvsenderMottaker avsenderMottaker;
    @AuraEnabled
    public CRM_Bruker bruker;
    @AuraEnabled
    public CRM_Sak sak;
    @AuraEnabled
    public List<CRM_Dokumenter> dokumenter;

    public CRM_JournalEntryWrapper() {
    }
}

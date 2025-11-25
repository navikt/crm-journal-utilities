global class CRM_Dokumenter {
    @AuraEnabled
    public String tittel;
    @AuraEnabled
    public String brevkode;
    @AuraEnabled
    public String dokumentkategori; //EX: SOK, SED or FORVALTNINGSNOTAT
    @AuraEnabled
    public String overstyrInnsynsregler; // VISES_MASKINELT_GODKJENT or VISES_MANUELT_GODKJENT - https://confluence.adeo.no/spaces/BOA/pages/313346837/opprettJournalpost
    @AuraEnabled
    public List<CRM_Dokumentvarianter> dokumentvarianter;
}

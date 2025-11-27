global class CRM_Dokumenter {
    @AuraEnabled
    public String tittel;
    @AuraEnabled
    public String brevkode;
    @AuraEnabled
    public String dokumentkategori; //EX: SOK, SED or FORVALTNINGSNOTAT
    @AuraEnabled
    public List<CRM_Dokumentvarianter> dokumentvarianter;
}

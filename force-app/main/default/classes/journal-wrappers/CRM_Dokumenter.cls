global class CRM_Dokumenter {
    @AuraEnabled
    public String tittel;
    @AuraEnabled
    public String brevkode;
    @AuraEnabled
    public List<CRM_Dokumentvarianter> dokumentvarianter;
}

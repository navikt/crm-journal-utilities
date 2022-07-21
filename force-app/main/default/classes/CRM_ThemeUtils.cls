public class CRM_ThemeUtils {
    /**
     * @description: Retrieves all active theme groups, themes and subthemes and returns
     * and returns in a hierarchical mapped wrapper class
     * @author Stian Ruud Schikora | 11-20-2020
     * @return Categories
     **/
    @AuraEnabled(Cacheable=true)
    public static Categories getCategorization() {
        return getCategorizationByThemeSet('ARCHIVE_THEMES');
    }

    @AuraEnabled(Cacheable=true)
    public static Categories getCategorizationByThemeSet(String themeSet) {
        Boolean onlyArchiveThemes = themeSet.equalsIgnoreCase('ARCHIVE_THEMES');
        List<Common_Code__c> themeGroups = [
            SELECT Id, Name, CRM_Code__c, CRM_Code_Set__c
            FROM Common_Code__c
            WHERE CRM_Code_set__c = 'Temagrupper' AND CRM_Active__c = TRUE
            ORDER BY Name
        ];
        String query = 'SELECT Id, Name, CRM_Code__c, CRM_Code_Set__c, CRM_Parent_Code__r.CRM_Code__c, (SELECT Id, Name, CRM_Display_Name__c, CRM_Code__c, CRM_Code_Set__c, CRM_Parent_Code__r.CRM_Code__c, CRM_Subtheme__c, CRM_Subtheme_Code__c, CRM_Subtype__c, CRM_Subtype_Code__c FROM Child_Codes__r WHERE CRM_Code_Set__c = \'Gjelder\' AND CRM_Active__c = TRUE ORDER BY CRM_Display_Name__c) FROM Common_Code__c WHERE CRM_Code_set__c = \'Tema\' AND CRM_Active__c = TRUE ';
        query += onlyArchiveThemes ? 'AND CRM_Archive_Theme__c = TRUE ORDER BY NAME' :  'ORDER BY NAME';
        List<Common_Code__c> themeWithGjelder = Database.query(query);

        Map<String, List<Common_Code__c>> themeMap = new Map<String, List<Common_Code__c>>();
        Map<String, List<Common_Code__c>> gjelderMap = new Map<String, List<Common_Code__c>>();

        for (Common_Code__c theme : themeWithGjelder) {
            if (themeMap.containsKey(theme.CRM_Parent_Code__r.Id)) {
                List<Common_Code__c> mapThemes = themeMap.get(theme.CRM_Parent_Code__r.Id);
                mapThemes.add(theme);
                themeMap.put(theme.CRM_Parent_Code__r.Id, mapThemes);
            } else {
                themeMap.put(theme.CRM_Parent_Code__r.Id, new List<Common_Code__c>{ theme });
            }

            for (Common_Code__c gjelder : theme.Child_Codes__r) {
                if (gjelderMap.containsKey(gjelder.CRM_Parent_Code__r.Id)) {
                    List<Common_Code__c> tempGjelderMap = gjelderMap.get(gjelder.CRM_Parent_Code__r.Id);
                    tempGjelderMap.add(gjelder);
                    gjelderMap.put(gjelder.CRM_Parent_Code__r.Id, tempGjelderMap);
                } else {
                    gjelderMap.put(gjelder.CRM_Parent_Code__r.Id, new List<Common_Code__c>{ gjelder });
                }
            }
        }

        return new Categories(themeGroups, themeMap, gjelderMap);
    }

    @testVisible
    private class Categories {
        @AuraEnabled
        public List<Common_Code__c> themeGroups;
        @AuraEnabled
        public Map<String, List<Common_Code__c>> themeMap; //Mapping a theme group Id to list of themes
        @AuraEnabled
        public Map<String, List<Common_Code__c>> gjelderMap; //Mapping a theme Id to a list of gjelder values, which includes subtheme and/or subtype

        public Categories(
            List<Common_Code__c> themeGroups,
            Map<String, List<Common_Code__c>> themeMap,
            Map<String, List<Common_Code__c>> gjelderMap
        ) {
            this.themeGroups = themeGroups;
            this.themeMap = themeMap;
            this.gjelderMap = gjelderMap;
        }
    }
}

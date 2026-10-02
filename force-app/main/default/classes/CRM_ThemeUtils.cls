public class CRM_ThemeUtils {
    private static final Integer CACHE_TTL_SECONDS = 300;

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
        Boolean onlyArchiveThemes = 'ARCHIVE_THEMES'.equalsIgnoreCase(themeSet);
        String cacheKey = onlyArchiveThemes ? 'CRMThemeUtilsArchiveCategorization' : 'CRMThemeUtilsAllCategorization';

        Categories cached;
        try {
            cached = (Categories) Cache.Org.get(cacheKey);
        } catch (Exception e) {
            cached = null;
        }

        if (cached != null) {
            return cached;
        }

        Categories computed = buildCategorization(onlyArchiveThemes);

        try {
            Cache.Org.put(cacheKey, computed, CACHE_TTL_SECONDS);
        } catch (Exception e) {
            return computed;
        }

        return computed;
    }

    private static Categories buildCategorization(Boolean onlyArchiveThemes) {
        List<Common_Code__c> themeGroups = [
            SELECT Id, Name, CRM_Code__c, CRM_Code_Set__c
            FROM Common_Code__c
            WHERE CRM_Code_set__c = 'Temagrupper' AND CRM_Active__c = TRUE
            ORDER BY Name
        ];

        String query = 'SELECT Id, Name, CRM_Code__c, CRM_Code_Set__c, CRM_Parent_Code__c, CRM_Available__c, ' +
            '(SELECT Id, Name, CRM_Display_Name__c, CRM_Code__c, CRM_Code_Set__c, CRM_Parent_Code__c, ' +
            'CRM_Subtheme__c, CRM_Subtheme_Code__c, CRM_Subtype__c, CRM_Subtype_Code__c ' +
            'FROM Child_Codes__r WHERE CRM_Code_Set__c = \'Gjelder\' AND CRM_Active__c = TRUE ORDER BY CRM_Display_Name__c) ' +
            'FROM Common_Code__c WHERE CRM_Code_set__c = \'Tema\' AND CRM_Active__c = TRUE ';
        query += onlyArchiveThemes ? 'AND CRM_Archive_Theme__c = TRUE ORDER BY Name' : 'ORDER BY Name';

        List<Common_Code__c> themeWithGjelder = Database.query(query);

        Map<String, List<Common_Code__c>> themeMap = new Map<String, List<Common_Code__c>>();
        Map<String, List<Common_Code__c>> gjelderMap = new Map<String, List<Common_Code__c>>();

        for (Common_Code__c theme : themeWithGjelder) {
            String themeGroupId = theme.CRM_Parent_Code__c;
            if (!themeMap.containsKey(themeGroupId)) {
                themeMap.put(themeGroupId, new List<Common_Code__c>());
            }
            themeMap.get(themeGroupId).add(theme);

            for (Common_Code__c gjelder : theme.Child_Codes__r) {
                String themeId = gjelder.CRM_Parent_Code__c;
                if (!gjelderMap.containsKey(themeId)) {
                    gjelderMap.put(themeId, new List<Common_Code__c>());
                }
                gjelderMap.get(themeId).add(gjelder);
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
@isTest
public class CRM_ThemeUtils_Test {
    @TestSetup
    static void makeData() {
        Common_Code__c themeGroup = (Common_Code__c) JOURNAL_TestDataFactory.createRecord(
            new Common_Code__c(Name = 'Arbeid', CRM_Code_Set__c = 'Temagrupper', CRM_Code__c = 'ARBD')
        );
        List<Common_Code__c> themes = new List<Common_Code__c>{
            new Common_Code__c(
                Name = 'Arbeidavklaringspenger',
                CRM_Code_Set__c = 'Tema',
                CRM_Code__c = 'AAP',
                CRM_Archive_Theme__c = true,
                CRM_Parent_Code__c = themeGroup.Id
            )
        };
        themes.add(
            new Common_Code__c(
                Name = 'Dagpenger',
                CRM_Code_Set__c = 'Tema',
                CRM_Code__c = 'DAG',
                CRM_Archive_Theme__c = true,
                CRM_Parent_Code__c = themeGroup.Id
            )
        );
        themes = (List<Common_Code__c>) JOURNAL_TestDataFactory.createRecordList(themes);

        List<Common_Code__c> subthemes = new List<Common_Code__c>{
            new Common_Code__c(
                Name = 'Dagpenger under permittering',
                CRM_Code_Set__c = 'Behandlingstema',
                CRM_Code__c = 'ab0005'
            )
        };
        subthemes.add(
            new Common_Code__c(Name = 'Papirmeldekort', CRM_Code_Set__c = 'Behandlingstema', CRM_Code__c = 'ab0430')
        );
        subthemes = (List<Common_Code__c>) JOURNAL_TestDataFactory.createRecordList(subthemes);

        List<Common_code__c> subtypes = new List<Common_code__c>{
            new Common_Code__c(Name = 'Utbetaling', CRM_Code_Set__c = 'Behandlingstyper', CRM_Code__c = 'ae0007')
        };
        subtypes.add(new Common_Code__c(Name = 'Utland', CRM_Code_Set__c = 'Behandlingstyper', CRM_Code__c = 'ae0106'));
        subtypes = (List<Common_Code__c>) JOURNAL_TestDataFactory.createRecordList(subtypes);

        List<Common_code__c> gjelder = new List<Common_code__c>{
            new Common_Code__c(
                Name = 'Papirmeldekort',
                CRM_Code_set__c = 'Gjelder',
                CRM_Code__c = 'AAPTMab0430',
                CRM_Parent_Code__c = themes[0].Id,
                CRM_Subtheme__c = subthemes[1].Id
            )
        };
        gjelder.add(
            new Common_code__c(
                Name = 'Utbetaling',
                CRM_Code_set__c = 'Gjelder',
                CRM_Code__c = 'AAPTYae0007',
                CRM_Parent_Code__c = themes[0].Id,
                CRM_Subtype__c = subtypes[0].Id
            )
        );
        gjelder.add(
            new Common_code__c(
                Name = 'Dagpenger under permittering - Utland',
                CRM_Code_set__c = 'Gjelder',
                CRM_Code__c = 'DAGTMab0005TYae0106',
                CRM_Parent_Code__c = themes[1].Id,
                CRM_Subtheme__c = subthemes[0].Id,
                CRM_Subtype__c = subtypes[1].Id
            )
        );
        gjelder = (List<Common_Code__c>) JOURNAL_TestDataFactory.createRecordList(gjelder);

        gjelder[2].CRM_Display_Name__c = 'Permitert dagpenger i utland';
        update gjelder[2];
    }

    @isTest
    static void testGetCategorization() {
        Test.startTest();
        CRM_ThemeUtils.Categories categories = CRM_ThemeUtils.getCategorization();
        Test.stopTest();

        System.assertEquals('Arbeid', categories.themeGroups[0].Name);
        String themeGroupId = categories.themeGroups[0].Id;
        System.assertEquals('Arbeidavklaringspenger', categories.themeMap.get(themeGroupId)[0].Name);
        String themeId = categories.themeMap.get(themeGroupId)[0].Id;
        System.assertEquals('Papirmeldekort', categories.gjelderMap.get(themeId)[0].Name);
        String themeDisplayId = categories.themeMap.get(themeGroupId)[1].Id;
        System.assertEquals('Permitert dagpenger i utland', categories.gjelderMap.get(themeDisplayId)[0].CRM_Display_Name__c);
    }
}

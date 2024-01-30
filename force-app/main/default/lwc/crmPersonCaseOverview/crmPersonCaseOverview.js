import { LightningElement, api, wire } from 'lwc';
import getCases from '@salesforce/apex/CRM_NavSakService.getSafActorCases';
import getCategorization from '@salesforce/apex/CRM_ThemeUtils.getCategorization';
import crmSingleValueUpdate from '@salesforce/messageChannel/crmSingleValueUpdate__c';

/* 2 different html template */
import noFilterTemplate from './crmPersonCaseOverview.html';
import themeTemplate from './crmPersonCaseTheme.html';

import { publish, MessageContext } from 'lightning/messageService';

//##LABEL IMPORTS
import VALIDATION_ERROR from '@salesforce/label/c.CRM_NAV_Case_Validation_Error';
import NAV_CASE_RETRIEVE_ERROR from '@salesforce/label/c.CRM_NAV_Case_Retrieve_Error';
import NO_CASES_ERROR from '@salesforce/label/c.CRM_Journal_Case_List_No_Cases_Error';
import NO_CASES_FOR_THEME_GROUP from '@salesforce/label/c.CRM_No_Cases_for_Selected_Theme_Group';

// eslint-disable-next-line @lwc/lwc/no-leading-uppercase-api-name
export default class NksPersonCaseOverview extends LightningElement {
    @api labels = {
        VALIDATION_ERROR,
        NAV_CASE_RETRIEVE_ERROR,
        NO_CASES_ERROR,
        NO_CASES_FOR_THEME_GROUP
    };

    @api actorId;
    @api prefilledThemeGroup; //Give the theme categorization child component a prefilled value
    @api prefilledTheme; //Set prefilled theme EX: OPP
    @api viewType; // Set viewType default value =NO_FILTER
    // eslint-disable-next-line @lwc/lwc/valid-api
    @api FAGSAK_ONLY = false;
    caseList = []; //Contains all NAV cases returned from the API
    displayedCaseGroups = []; //Holds the list of case groups to be displayed
    groupedCases = [];
    selectedCase;
    themeGroupOptions = [];
    filteredThemes = [];
    themeMap;
    casesLoaded = false;
    error = false;
    selectedCaseType = 'FAGSAK'; //Default value
    @api paddingBottom;

    caseTypeOptions = [
        { label: 'Fagsak', value: 'FAGSAK' },
        { label: 'Generell', value: 'GENERELL_SAK' }
    ];

    get personTemplate() {
        if (this.viewType === 'THEME') {
            return true;
        }
        return false;
    }

    render() {
        return this.personTemplate ? themeTemplate : noFilterTemplate;
    }

    renderedCallback() {
        this.setSelectedNavCase(this.selectedCaseId);
    }

    @wire(MessageContext)
    messageContext;

    @wire(getCategorization, {})
    categoryResults({ data }) {
        if (data) {
            let themeGroups = [{ label: 'Alle', value: 'ALL' }];
            let mappedThemes = {};

            data.themeGroups.forEach((themeGroup) => {
                themeGroups.push({
                    label: themeGroup.Name,
                    value: themeGroup.Id
                });
                //Creating the theme map (ThemegroupId (SF) => [{ themeCode: code, themeSfId: id}])
                let groupThemes = {};
                groupThemes.themes = [];
                if (data.themeMap[themeGroup.Id]) {
                    groupThemes.themes = data.themeMap[themeGroup.Id].map((theme) => {
                        return {
                            themeCode: theme.CRM_Code__c,
                            themeSfId: theme.Id,
                            themeGroupCode: themeGroup.CRM_Code__c
                        };
                    });
                }
                //Property function to determine if the group of themes includes an input theme
                groupThemes.hasTheme = (inputTheme) => {
                    let returnTheme = null;
                    for (let idx = 0; idx < groupThemes.themes.length; idx++) {
                        const theme = groupThemes.themes[idx];
                        if (theme.themeCode === inputTheme) {
                            returnTheme = theme;
                            break;
                        }
                    }
                    return returnTheme;
                };
                mappedThemes[themeGroup.Id] = groupThemes;
                mappedThemes.getTheme = (inputTheme) => {
                    let returnTheme = null;
                    for (const themeGroupId in mappedThemes) {
                        if (Object.prototype.hasOwnProperty.call(mappedThemes, themeGroupId)) {
                            returnTheme = Object.prototype.hasOwnProperty.call(mappedThemes[themeGroupId], 'hasTheme')
                                ? mappedThemes[themeGroupId].hasTheme(inputTheme)
                                : null;
                            if (returnTheme !== null) break;
                        }
                    }
                    return returnTheme;
                };
            });

            this.themeGroupOptions = themeGroups;
            this.themeMap = mappedThemes;
        }
    }

    @wire(getCases, { actorId: '$actorId' })
    wireUser({ error, data }) {
        if (data) {
            let tempCases = [];
            if (this.viewType === 'THEME') {
                for (let i = 0; i < data.length; i++) {
                    if (data[i].tema === this.prefilledTheme) {
                        tempCases.push(data[i]);
                    }
                }
                this.groupCases(tempCases);
                this.caseList = tempCases;
            } else {
                this.groupCases(data);
                this.caseList = data;
            }

            //this.caseList = data;
            this.casesLoaded = true;
        }
        if (error) {
            console.log(JSON.stringify(error, null, 2));
            this.error = true;
        }
    }

    groupCases(cases) {
        let groupedCases = {};
        let caseGroups = [];

        cases.forEach((caseItem) => {
            if (Object.prototype.hasOwnProperty.call(groupedCases, caseItem.themeName)) {
                groupedCases[caseItem.themeName].push(caseItem);
            } else {
                groupedCases[caseItem.themeName] = [];
                groupedCases[caseItem.themeName].push(caseItem);
            }
        });

        // eslint-disable-next-line @salesforce/aura/ecma-intrinsics, compat/compat
        for (const [key, value] of Object.entries(groupedCases)) {
            caseGroups.push({ themeName: key, theme: value[0].tema, cases: value });
        }

        this.groupedCases = caseGroups;
        this.displayedCaseGroups = caseGroups;
    }

    //Handles the nksNavCaseItem click event and updates the selected attribute for all the childs
    handleCaseSelected(event) {
        let selectedNavCaseId = event.detail.selectedCase.fagsakId;
        this.selectedCase = event.detail.selectedCase;

        this.setSelectedNavCase(selectedNavCaseId);
        this.publishFieldChange('themeCode', this.selectedCaseTheme);
    }

    setSelectedNavCase(selectedNavCaseId) {
        let caseLists = this.template.querySelectorAll('c-crm-nav-case-list');
        caseLists.forEach((caseList) => {
            caseList.setSelectedNavCase(selectedNavCaseId);
        });
    }

    handleFilterChange(event) {
        let themeGroup = event.target.value;

        if (themeGroup === 'ALL') {
            this.displayedCaseGroups = this.groupedCases;
        } else {
            this.displayedCaseGroups = this.groupedCases.filter((caseGroup) => {
                return this.themeMap[themeGroup].hasTheme(caseGroup.theme) !== null;
            });
        }
    }

    handleCaseTypeChange(event) {
        this.selectedCase = null;
        this.selectedCaseType = event.detail.value;
    }

    //Publish to nksWorkAllocation component to trigger search in flow context
    publishFieldChange(field, value) {
        const payload = { name: field, value: value };
        publish(this.messageContext, crmSingleValueUpdate, payload);
    }

    @api
    get selectedCaseId() {
        return this.selectedCase ? this.selectedCase.fagsakId : null;
    }

    @api
    get selectedCaseLegacySystem() {
        return this.selectedCase ? this.selectedCase.fagsaksystem : null;
    }

    @api
    get selectedCaseLegacyId() {
        return this.selectedCase ? this.selectedCase.arkivsaksnummer : null;
    }

    @api
    get selectedCaseTheme() {
        if (this.isGeneralCase === true) {
            let themeCmp = this.template.querySelector('c-crm-theme-categorization');
            return themeCmp.themeCode;
        }
        return this.selectedCase ? this.selectedCase.tema : null;
    }

    @api
    get selectedCaseThemeSfId() {
        if (this.isGeneralCase === true) {
            let themeCmp = this.template.querySelector('c-crm-theme-categorization');
            return themeCmp.theme;
        }
        let returnTheme = this.themeMap ? this.themeMap.getTheme(this.selectedCaseTheme) : null;
        return returnTheme !== null ? returnTheme.themeSfId : null;
    }

    @api
    get selectedThemeGroupSfId() {
        let themeGroupSfId;

        if (this.isGeneralCase === true) {
            let themeCmp = this.template.querySelector('c-crm-theme-categorization');
            themeGroupSfId = themeCmp.themeGroup;
        } else {
            if (this.themeMap) {
                Object.keys(this.themeMap).forEach((themeGroupId) => {
                    if (Object.prototype.hasOwnProperty.call(this.themeMap[themeGroupId], 'hasTheme')) {
                        if (this.themeMap[themeGroupId].hasTheme(this.selectedCaseTheme) !== null)
                            themeGroupSfId = themeGroupId;
                    }
                });
            }
        }
        return themeGroupSfId;
    }

    @api
    get selectedThemeGroup() {
        let themeGroupCode;

        if (this.isGeneralCase === true) {
            let themeCmp = this.template.querySelector('c-crm-theme-categorization');
            themeGroupCode = themeCmp.themeGroup;
        } else {
            if (this.themeMap) {
                let mappedTheme = this.themeMap.getTheme(this.selectedCaseTheme);
                if (mappedTheme) themeGroupCode = this.themeMap.getTheme(this.selectedCaseTheme).themeGroupCode;
            }
        }
        return themeGroupCode;
    }

    @api
    get navCaseType() {
        return this.selectedCaseType;
    }

    //When GENERELL_SAK is chosen, the agent has the ability to also select a subtheme for the journal entry
    @api
    get selectedSubthemeSfId() {
        let subthemeSfId;
        if (this.isGeneralCase === true) {
            let themeCmp = this.template.querySelector('c-crm-theme-categorization');
            subthemeSfId = themeCmp.subtheme;
        }
        return subthemeSfId;
    }

    @api
    get selectedSubtheme() {
        let subtheme;
        if (this.isGeneralCase === true) {
            let themeCmp = this.template.querySelector('c-crm-theme-categorization');
            subtheme = themeCmp.subthemeCode;
        }
        return subtheme;
    }

    @api
    get selectedSubtypeSfId() {
        let subtypeSfId;
        if (this.isGeneralCase === true) {
            let themeCmp = this.template.querySelector('c-crm-theme-categorization');
            subtypeSfId = themeCmp.subtype;
        }
        return subtypeSfId;
    }

    @api
    get selectedSubtype() {
        let subtype;
        if (this.isGeneralCase === true) {
            let themeCmp = this.template.querySelector('c-crm-theme-categorization');
            subtype = themeCmp.subtypeCode;
        }
        return subtype;
    }

    get isGeneralCase() {
        return this.selectedCaseType === 'GENERELL_SAK';
    }

    get showCases() {
        return this.hasCases && !this.isGeneralCase;
    }

    get hasCases() {
        return this.dataLoaded && this.caseList.length !== 0;
    }

    get dataLoaded() {
        return (this.error === true || this.casesLoaded === true) && this.themeMap;
    }

    get hasThemeGroupCases() {
        return this.displayedCaseGroups.length > 0;
    }

    get hasTheme() {
        if (this.prefilledTheme !== null || this.prefilledTheme !== '') {
            return true;
        }
        return false;
    }

    @api
    validate() {
        //Theme and theme group must be set
        if (this.selectedCase) {
            return { isValid: true };
        } else if (this.isGeneralCase === true) {
            let themeCmp = this.template.querySelector('c-crm-theme-categorization');
            return themeCmp.validate();
        }
        return {
            isValid: false,
            errorMessage: VALIDATION_ERROR
        };
    }
}

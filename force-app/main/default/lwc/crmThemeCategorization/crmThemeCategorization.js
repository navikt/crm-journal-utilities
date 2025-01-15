import { LightningElement, api, wire } from 'lwc';
import crmSingleValueUpdate from '@salesforce/messageChannel/crmSingleValueUpdate__c';
import getCategorization from '@salesforce/apex/CRM_ThemeUtils.getCategorizationByThemeSet';
import oneColumnHTML from './oneColumnLayout.html';
import twoColumnsHTML from './twoColumnsLayout.html';
import { publish, MessageContext } from 'lightning/messageService';

//#### LABEL IMPORTS ####
import VALIDATION_ERROR from '@salesforce/label/c.CRM_Theme_Categorization_Validation_Error';

export default class CRMThemeCategorization extends LightningElement {
    @api paddingBottom;
    @api optionalThemeGroup = false;
    @api optionalTheme = false;
    @api themeSet = 'ARCHIVE_THEMES'; //Allow defining if the resulting themes should be restricted to only archive themes or not
    @api variant = 'DEFAULT'; // HIDE_THEME_GROUP, HIDE_SUBTHEME, HIDE_THEME_GROUP_AND_SUBTHEME, JOURNAL
    @api autoFocus = false;
    @api twoColumns = false;
    @api checkIfGjelderIsRequired = false;

    themeGroups = [];
    gjelderMap;
    themeMap;
    categories;
    chosenThemeGroup;
    chosenTheme;
    chosenGjelder;
    chosenSubtheme;
    chosenSubtype;
    gjelderList;
    themes;
    hasRendered = false;

    @wire(MessageContext)
    messageContext;

    @wire(getCategorization, { themeSet: '$themeSet' })
    categoryResults({ data, error }) {
        if (data) {
            this.categories = data;
            let groups = [];
            this.categories.themeGroups.forEach((themeGroup) => {
                groups.push({ label: themeGroup.Name, value: themeGroup.Id });
            });

            this.themeGroups = groups;
            this.themeMap = data.themeMap;
            this.gjelderMap = data.gjelderMap;

            if (this.chosenThemeGroup || this.chosenTheme) {
                if (this.themeGroupCode != '' && this.themeGroupVisible)
                    this.publishFieldChange('themeGroupCode', this.themeGroupCode);
                if (this.themeCode != '') this.publishFieldChange('themeCode', this.themeCode);
                this.filterThemes();
            } else if (!this.themeGroupVisible) {
                this.filterThemes();
            }

            // This logic checks if there are any given subthemes and subtypes,
            // and finds the correct gjelder relation for the combination
            if (this.chosenTheme && this.subthemeVisible) {
                this.filterGjelder();
                if (this.chosenSubtheme || this.chosenSubtype) {
                    this.chosenGjelder = '';
                    let validGjelder =
                        this.theme &&
                        this.gjelderMap &&
                        Object.keys(this.gjelderMap).length !== 0 &&
                        this.gjelderMap.hasOwnProperty(this.theme)
                            ? this.gjelderMap[this.theme]
                            : [];
                    for (let gjelder of validGjelder) {
                        if (
                            gjelder.CRM_Subtheme__c === this.chosenSubtheme &&
                            gjelder.CRM_Subtype__c === this.chosenSubtype
                        ) {
                            this.chosenGjelder = gjelder.Id;
                            this.publishFieldChange('subThemeCode', gjelder.CRM_Subtheme_Code__c);
                            this.publishFieldChange('subTypeCode', gjelder.CRM_Subtype_Code__c);
                            break;
                        }
                    }
                }
            }
        }
    }

    render() {
        return this.twoColumns ? twoColumnsHTML : oneColumnHTML;
    }

    renderedCallback() {
        if (this.hasRendered === false && this.autoFocus) {
            this.template.querySelectorAll('lightning-combobox')[0].focus();
            this.hasRendered = true;
        }
    }

    // #### GETTERS ####
    get wrapperClass() {
        return this.paddingBottom ? 'wrapper' : '';
    }

    get requireTheme() {
        return !this.optionalTheme || !this.themeGroupVisible;
    }

    get requireThemeGroup() {
        return !this.optionalThemeGroup;
    }

    get requireGjelder() {
        return this.variant === 'JOURNAL' || (this.checkIfGjelderIsRequired && this.themeCode === 'AAP');
    }

    get gjelderPlaceholder() {
        let placeholder = '(Ikke valgt)';
        if (this.chosenTheme && this.gjelderMap) {
            let themeInMap = this.chosenTheme in this.gjelderMap;
            placeholder = this.gjelderMap && themeInMap ? '(Ikke valgt)' : '(Ingen undertema)';
        }

        return placeholder;
    }

    get themeDisabled() {
        return !this.chosenThemeGroup && this.themeGroupVisible;
    }

    get gjelderDisabled() {
        let disabled =
            !this.chosenTheme ||
            (this.chosenTheme &&
                this.gjelderMap &&
                (Object.keys(this.gjelderMap).length === 0 || !(this.chosenTheme in this.gjelderMap)));
        return disabled;
    }

    get themeGroupVisible() {
        return !(this.variant === 'HIDE_THEME_GROUP' || this.variant === 'HIDE_THEME_GROUP_AND_SUBTHEME');
    }

    get subthemeVisible() {
        return !(this.variant === 'HIDE_SUBTHEME' || this.variant === 'HIDE_THEME_GROUP_AND_SUBTHEME');
    }

    get themeClass() {
        return this.themeGroupVisible ? 'slds-size_6-of-12' : 'slds-size_6-of-12 slds-var-p-right_small';
    }

    // #### EVENT HANDLERS ####
    handleThemeGroupChange(event) {
        this.chosenThemeGroup = event.detail.value;
        this.chosenTheme = null;
        this.chosenGjelder = null;
        this.chosenSubtheme = null;
        this.chosenSubtype = null;
        this.filterThemes();

        this.publishFieldChange('themeGroupCode', this.themeGroupCode);
    }

    handleThemeChange(event) {
        this.chosenTheme = event.detail.value;
        this.chosenGjelder = null;
        this.chosenSubtheme = null;
        this.chosenSubtype = null;
        if (this.subthemeVisible) {
            this.filterGjelder();
        }
        this.publishFieldChange('themeCode', this.themeCode);
    }

    handleGjelderChange(event) {
        this.chosenGjelder = event.detail.value;
        this.chosenSubtheme = this.subthemeId;
        this.chosenSubtype = this.subtypeId;

        this.publishFieldChange('subThemeCode', this.subthemeCode);
        this.publishFieldChange('subTypeCode', this.subtypeCode);
    }

    // #### PUBLIC API FUNCTIONS ####
    @api
    get themeGroup() {
        return this.chosenThemeGroup;
    }

    set themeGroup(themeGroupValue) {
        this.chosenThemeGroup = themeGroupValue;
    }

    @api
    get theme() {
        return this.chosenTheme;
    }

    set theme(themeValue) {
        this.chosenTheme = themeValue;
    }

    @api
    get subtheme() {
        return this.chosenSubtheme;
    }

    set subtheme(subthemeValue) {
        this.chosenSubtheme = subthemeValue;
    }

    @api
    get subtype() {
        return this.chosenSubtype;
    }

    set subtype(subtypeValue) {
        this.chosenSubtype = subtypeValue;
    }

    @api
    get themeCode() {
        let themeCode = '';
        let themes = [];
        if (!this.themeGroupVisible && this.themeMap) {
            // if theme groups are hidden, then look for code in all themes
            Object.values(this.themeMap).forEach((values) => {
                themes = [...themes, ...values];
            });
        } else if (this.themeGroup && this.themeMap && this.themeMap.hasOwnProperty(this.themeGroup)) {
            // if theme group provided , then look for code in related themes
            themes = [...this.themeMap[this.themeGroup]];
        }

        for (let theme of themes) {
            if (theme.Id === this.theme) {
                themeCode = theme.CRM_Code__c;
                break;
            }
        }
        return themeCode;
    }

    @api
    get themeGroupCode() {
        let themeGroupCode = '';

        if (this.categories) {
            for (let themeGroup of this.categories.themeGroups) {
                if (themeGroup.Id === this.themeGroup) {
                    themeGroupCode = themeGroup.CRM_Code__c;
                    break;
                }
            }
        }
        return themeGroupCode;
    }

    @api
    get subthemeCode() {
        let subthemeCode = '';

        //Added subtheme check as flow was failing when chosing themes with no subthemes
        if (this.chosenGjelder && this.subthemeVisible) {
            let validGjelder =
                this.theme && this.gjelderMap && Object.keys(this.gjelderMap).length !== 0
                    ? this.gjelderMap[this.theme]
                    : [];
            for (let gjelder of validGjelder) {
                if (gjelder.Id === this.chosenGjelder) {
                    subthemeCode = gjelder.CRM_Subtheme_Code__c;
                    break;
                }
            }
        }

        return subthemeCode;
    }

    @api
    get subtypeCode() {
        let subtypeCode = '';
        if (this.chosenGjelder && this.subthemeVisible) {
            let validGjelder =
                this.theme && this.gjelderMap && Object.keys(this.gjelderMap).length !== 0
                    ? this.gjelderMap[this.theme]
                    : [];
            for (let gjelder of validGjelder) {
                if (gjelder.Id === this.chosenGjelder) {
                    subtypeCode = gjelder.CRM_Subtype_Code__c;
                    break;
                }
            }
        }

        return subtypeCode;
    }

    @api
    get subthemeId() {
        let subthemeId = '';

        //Added subtheme check as flow was failing when chosing themes with no subthemes
        if (this.chosenGjelder && this.subthemeVisible) {
            let validGjelder =
                this.theme && this.gjelderMap && Object.keys(this.gjelderMap).length !== 0
                    ? this.gjelderMap[this.theme]
                    : [];
            for (let gjelder of validGjelder) {
                if (gjelder.Id === this.chosenGjelder) {
                    subthemeId = gjelder.CRM_Subtheme__c;
                    break;
                }
            }
        }

        return subthemeId;
    }

    @api
    get subtypeId() {
        let subtypeId = '';
        if (this.chosenGjelder && this.subthemeVisible) {
            let validGjelder =
                this.theme && this.gjelderMap && Object.keys(this.gjelderMap).length !== 0
                    ? this.gjelderMap[this.theme]
                    : [];
            for (let gjelder of validGjelder) {
                if (gjelder.Id === this.chosenGjelder) {
                    subtypeId = gjelder.CRM_Subtype__c;
                    break;
                }
            }
        }

        return subtypeId;
    }

    //Validation preventing user moving to next screen in flow if state is not valid
    @api
    validate() {
        const isValid =
            (!this.requireGjelder || this.chosenGjelder) &&
            ((!this.themeGroupVisible && this.theme) ||
                (this.themeGroup && (this.theme || !this.requireTheme)) ||
                this.optionalThemeGroup);

        return {
            isValid,
            errorMessage: isValid ? null : VALIDATION_ERROR
        };
    }

    // #### PRIVATE FUNCTIONS ####
    filterThemes() {
        let returnThemes = [];
        if (!this.requireTheme) {
            returnThemes.push({ label: '(Ikke valgt)', value: '' });
        }
        //If the task already has a theme defined but no theme group
        if (this.chosenTheme && !this.chosenThemeGroup && this.themeGroupVisible) {
            for (const key in this.themeMap) {
                if (this.themeMap.hasOwnProperty(key)) {
                    this.themeMap[key].forEach((theme) => {
                        if (theme.Id === this.theme) {
                            returnThemes.push({
                                label: theme.Name,
                                value: theme.Id
                            });
                        }
                    });
                    break;
                }
            }
            this.themes = returnThemes;
        } else {
            let listThemes = [];
            // if theme groups are hidden, just add all themes
            // else only related themes
            if (!this.themeGroupVisible && this.themeMap) {
                Object.values(this.themeMap).forEach((values) => {
                    listThemes = [...listThemes, ...values];
                });
            } else if (this.themeGroup && this.themeMap && this.themeGroup in this.themeMap) {
                listThemes = [...this.themeMap[this.themeGroup]];
            }
            listThemes
                .filter((theme) => theme.CRM_Available__c === true)
                .forEach((theme) => {
                    returnThemes.push({ label: theme.Name, value: theme.Id });
                });
            this.themes = returnThemes.sort((a, b) => {
                return a.label.localeCompare(b.label, 'nb');
            });
        }
    }

    filterGjelder() {
        let listGjelder =
            this.chosenTheme &&
            this.gjelderMap &&
            Object.keys(this.gjelderMap).length !== 0 &&
            this.chosenTheme in this.gjelderMap
                ? this.gjelderMap[this.chosenTheme]
                : [];
        let returnGjelder = [];
        //Adding blank value for gjelder to allow removing value after one has been set.
        if (listGjelder.length !== 0) {
            returnGjelder.push({ label: '(Ikke valgt)', value: '' });
        }

        listGjelder.forEach((gjelder) => {
            if (
                this.variant !== 'JOURNAL' ||
                (this.variant === 'JOURNAL' && gjelder.CRM_Subtheme__c && !gjelder.CRM_Subtype__c)
            ) {
                returnGjelder.push({
                    label: gjelder.CRM_Display_Name__c,
                    value: gjelder.Id
                });
            }
        });

        this.gjelderList = returnGjelder;
    }

    publishFieldChange(field, value) {
        const payload = { name: field, value: value };
        publish(this.messageContext, crmSingleValueUpdate, payload);
    }
}

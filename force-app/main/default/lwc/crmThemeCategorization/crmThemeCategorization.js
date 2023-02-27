import { LightningElement, track, api, wire } from 'lwc';
import crmSingleValueUpdate from '@salesforce/messageChannel/crmSingleValueUpdate__c';
import getCategorization from '@salesforce/apex/CRM_ThemeUtils.getCategorizationByThemeSet';

import { publish, MessageContext } from 'lightning/messageService';

//#### LABEL IMPORTS ####
import VALIDATION_ERROR from '@salesforce/label/c.CRM_Theme_Categorization_Validation_Error';

export default class CRMThemeCategorization extends LightningElement {
    @track themeGroups = [];
    @track gjelderMap;
    @track themeMap;
    categories;
    chosenThemeGroup;
    chosenTheme;
    chosenGjelder;
    chosenSubtheme;
    chosenSubtype;
    gjelderList;
    themes;
    @api paddingBottom;
    @api optionalTheme = false;
    @api themeSet = 'ARCHIVE_THEMES'; //Allow defining if the resulting themes should be restricted to only archive themes or not
    @api variant = 'DEFAULT'; // HIDE_THEME_GROUP, HIDE_SUBTHEME, HIDE_THEME_GROUP_AND_SUBTHEME

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
                if (this.themeGroupCode != '') this.publishFieldChange('themeGroupCode', this.themeGroupCode);
                if (this.themeCode != '') this.publishFieldChange('themeCode', this.themeCode);
                this.filterThemes();
            }

            // This logic checks if there are any given subthemes and subtypes,
            // and finds the correct gjelder relation for the combination
            if (this.chosenTheme) {
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

        this.filterGjelder();

        this.publishFieldChange('themeCode', this.themeCode);
    }

    handleGjelderChange(event) {
        this.chosenGjelder = event.detail.value;
        this.chosenSubtheme = this.subthemeId;
        this.chosenSubtype = this.subtypeId;

        this.publishFieldChange('subThemeCode', this.subthemeCode);
        this.publishFieldChange('subTypeCode', this.subtypeCode);
    }

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
        let themes =
            this.themeGroup && this.themeMap && this.themeMap.hasOwnProperty(this.themeGroup)
                ? this.themeMap[this.themeGroup]
                : [];

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
        if (this.chosenGjelder) {
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
        if (this.chosenGjelder) {
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
        if (this.chosenGjelder) {
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
        if (this.chosenGjelder) {
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

    get wrapperClass() {
        return this.paddingBottom ? 'wrapper' : '';
    }

    get requireTheme() {
        return !this.optionalTheme;
    }

    filterThemes() {
        let returnThemes = [];
        if (this.optionalTheme === true) {
            returnThemes.push({ label: '(Ikke valgt)', value: '' });
        }
        //If the task already has a theme defined but no theme group
        if (this.chosenTheme && !this.chosenThemeGroup) {
            for (const key in this.themeMap) {
                if (this.themeMap.hasOwnProperty(key)) {
                    this.themeMap[key].forEach((theme) => {
                        if (theme.Id == this.theme) {
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
            let listThemes =
                this.themeGroup && this.themeMap && this.themeGroup in this.themeMap
                    ? this.themeMap[this.themeGroup]
                    : [];
            listThemes.forEach((theme) => {
                returnThemes.push({ label: theme.Name, value: theme.Id });
            });
            this.themes = returnThemes;
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
            returnGjelder.push({
                label: gjelder.CRM_Display_Name__c,
                value: gjelder.Id
            });
        });

        this.gjelderList = returnGjelder;
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
        return !this.chosenThemeGroup ? true : false;
    }

    get gjelderDisabled() {
        let disabled =
            !this.chosenTheme ||
            (this.chosenTheme &&
                this.gjelderMap &&
                (Object.keys(this.gjelderMap).length === 0 || !(this.chosenTheme in this.gjelderMap)));
        return disabled;
    }

    get themeGruopVisible() {
        return this.variant === 'HIDE_THEME_GRUOP' || this.variant === 'HIDE_THEME_GROUP_AND_SUBTHEME' ? false : true; 
    }

    get subthemeVisible() {
        return this.variant === 'HIDE_SUBTHEME' || this.variant === 'HIDE_THEME_GROUP_AND_SUBTHEME' ? false : true;  
    }


    publishFieldChange(field, value) {
        const payload = { name: field, value: value };
        publish(this.messageContext, crmSingleValueUpdate, payload);
    }

    //Validation preventing user moving to next screen in flow if state is not valid
    @api
    validate() {
        //Theme and theme group must be set
        if (this.themeGroup && (this.theme || this.optionalTheme)) {
            return { isValid: true };
        } else {
            return {
                isValid: false,
                errorMessage: VALIDATION_ERROR
            };
        }
    }
}

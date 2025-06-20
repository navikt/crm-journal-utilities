import { LightningElement, api } from 'lwc';
import originalTemplate from './crmNavCaseList.html';
import newDesignTemplate from './crmNavCaseListNewDesign.html';

//##LABEL IMPORTS
import COL_CREATED_DATE from '@salesforce/label/c.CRM_Journal_Case_List_Col_Created_Date';
import COL_CASE_ID from '@salesforce/label/c.CRM_Journal_Case_List_Col_Case_Id';

export default class NksNavCaseList extends LightningElement {
    @api themeName;
    @api cases;
    @api useNewDesign = false;

    showCases = false;
    labels = {
        COL_CREATED_DATE,
        COL_CASE_ID
    };

    render() {
        return this.useNewDesign ? newDesignTemplate : originalTemplate;
    }

    toggleCases() {
        this.showCases = !this.showCases;
    }

    checkKeyPress(event) {
        if (event.key === 'Enter') this.toggleCases(event);
    }

    handleCaseSelected(event) {
        let selectedCase = event.detail.selectedCase;
        //Passing event on to the parent
        const caseSelectedEvent = new CustomEvent('caseselected', {
            detail: { selectedCase }
        });
        this.dispatchEvent(caseSelectedEvent);
    }

    //Method called from parent when handling the caseselected event
    @api
    setSelectedNavCase(selectedNavCaseId) {
        let caseItems = this.template.querySelectorAll('c-crm-nav-case-item');
        caseItems.forEach((caseItem) => {
            caseItem.selected = caseItem.navCase.fagsakId === selectedNavCaseId;
        });
    }

    get chevronIcon() {
        return !this.showCases ? 'utility:chevronright' : 'utility:chevrondown';
    }

    get sortedCases() {
        let sortedCases = [...this.cases];
        sortedCases.sort((a, b) => {
            let longA = new Date(a.datoOpprettet).getTime();
            let longB = new Date(b.datoOpprettet).getTime();
            return longB - longA;
        });
        return sortedCases;
    }
}

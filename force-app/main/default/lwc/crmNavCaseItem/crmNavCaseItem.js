import { LightningElement, api } from 'lwc';
import originalTemplate from './crmNavCaseItem.html';
import newDesignTemplate from './crmNavCaseItemNewDesign.html';
import sharedStyling from './sharedStyling.css';

export default class NksNavCaseItem extends LightningElement {
    @api navCase;
    @api selected = false; //Attribute set by parent
    @api index;
    @api isLast;
    @api useNewDesign = false;

    static stylesheets = [sharedStyling];

    render() {
        return this.useNewDesign ? newDesignTemplate : originalTemplate;
    }

    caseSelected() {
        let selectedCase = this.navCase;
        //Sending event to parent that case was selected
        const caseSelectedEvent = new CustomEvent('caseselected', {
            detail: { selectedCase }
        });
        this.dispatchEvent(caseSelectedEvent);
    }

    checkKeyPress(event) {
        if (event.key === 'Enter') this.caseSelected(event);
    }

    get className() {
        return [
            this.useNewDesign ? 'slds-var-p-vertical_x-small' : 'slds-var-p-vertical_xx-small',
            'case-tile-bg',
            this.isLast ? 'item-last' : this.useNewDesign ? 'slds-border_bottom' : '',
            !this.useNewDesign && this.selected
                ? 'selected'
                : !this.useNewDesign && this.index % 2 === 1
                  ? 'item-grey'
                  : ''
        ]
            .filter(Boolean)
            .join(' ');
    }

    get isClosed() {
        return this.navCase ? this.navCase.lukket : false;
    }
}

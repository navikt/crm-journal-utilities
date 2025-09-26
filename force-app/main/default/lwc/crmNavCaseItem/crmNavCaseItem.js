import { LightningElement, api } from 'lwc';

export default class NksNavCaseItem extends LightningElement {
    @api navCase;
    @api selected = false; //Attribute set by parent
    @api index;
    @api isLast;

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
            'slds-var-p-vertical_x-small',
            'case-tile-bg',
            this.isLast ? 'item-last' : 'slds-border_bottom',
            ''
        ]
            .filter(Boolean)
            .join(' ');
    }

    get isClosed() {
        return this.navCase ? this.navCase.lukket : false;
    }
}

import { LightningElement, api } from 'lwc';

export default class NksNavCaseItem extends LightningElement {
    @api navCase;
    @api selected = false; //Attribute set by parent
    @api index;
    @api isLast;

    caseSelected(event) {
        let selectedCase = this.navCase;
        //Sending event to parent that case was selected
        const caseSelectedEvent = new CustomEvent('caseselected', {
            detail: { selectedCase }
        });
        this.dispatchEvent(caseSelectedEvent);
    }

    get className() {
        return (
            'slds-var-p-top_xx-small slds-var-p-bottom_xx-small case-tile-bg ' +
            (this.isLast ? 'item-last ' : '') +
            (this.selected ? 'selected' : this.index % 2 === 1 ? 'item-grey' : '')
        );
    }

    checkKeyPress(event) {
        if (event.key === 'Enter') this.caseSelected(event);
    }

    get isClosed() {
        return this.navCase ? (this.navCase.lukket ? true : false) : false;
    }
}

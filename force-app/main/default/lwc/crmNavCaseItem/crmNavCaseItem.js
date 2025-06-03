import { LightningElement, api } from 'lwc';

export default class NksNavCaseItem extends LightningElement {
    @api navCase;
    @api selected = false; //Attribute set by parent
    @api index;
    @api isLast;
    @api useNewDesign = false;

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
        let classNames =
            (this.useNewDesign ? 'slds-var-p-vertical_x-small ' : 'slds-var-p-vertical_xx-small ') + 'case-tile-bg ';

        if (this.isLast) {
            classNames += 'item-last ';
        }

        classNames += this.selected ? 'selected' : this.index % 2 === 1 ? 'item-grey' : '';

        return classNames;
    }

    get isClosed() {
        return this.navCase ? this.navCase.lukket : false;
    }

    get itemClass() {
        return this.useNewDesign ? 'custom-padding' : 'slds-var-p-left_medium';
    }
}

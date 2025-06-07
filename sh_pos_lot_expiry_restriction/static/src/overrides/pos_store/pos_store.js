/** @odoo-module */
import { ConfirmPopup } from "@point_of_sale/app/utils/confirm_popup/confirm_popup";
import { ErrorPopup } from "@point_of_sale/app/errors/popups/error_popup";
import { PosStore } from "@point_of_sale/app/store/pos_store";
import { patch } from "@web/core/utils/patch";

patch(PosStore.prototype, {
    async getEditedPackLotLines(
        isAllowOnlyOneLot,
        packLotLinesToEdit,
        productName
    ) {

        let result = await super.getEditedPackLotLines(...arguments);
        if (
            this.config.sh_lot_expiry_warning ||
            (this.config.sh_restrict_lot_expiry &&
                (product.alert_time || product.use_expiration_date))
        ) {
            let productlist = this.db.product_by_tmpl_id;
            let product;
            for (const key in productlist) {
                for (const key2 in productlist[key]) {
                    if (productlist[key][key2].display_name == productName) {
                        product = productlist[key][key2];
                    }
                }
            }
            let existingLots = [];
            try {
                existingLots = await this.orm.call(
                    "pos.order.line",
                    "sh_get_existing_lots",
                    [this.company.id, product.id],
                    {
                        context: {
                            config_id: this.config.id,
                        },
                    }
                );
            } catch (ex) {
                alert("Can't load lots");
                console.log("Collecting sh existing records fail", ex);
            }
            let Currentdate = new Date();
            let daysToAdd = product.use_expiration_date
                ? product.alert_time
                : 0;
            let lotName = result?.newPackLotLines[0]?.lot_name;
            let addedDate = new Date();
            let selectedLot = existingLots?.filter(
                (lot) => lot.name == lotName
            );
            let expiry_value = false;

            if (!lotName) {
                return result;
            }
            if (selectedLot.length > 0 && selectedLot[0].expiration_date) {
                expiry_value = selectedLot[0].expiration_date;
            }
            let expiry_date = expiry_value
                ? new Date(selectedLot[0].expiration_date)
                : "";
            let timeDifference = expiry_date - Currentdate;
            let daysDifference = timeDifference / (1000 * 3600 * 24);

            addedDate.setDate(addedDate.getDate() + daysToAdd);
            console.log(daysDifference);
            console.log(Math.round(daysDifference));
            
            if (
                Math.round(daysDifference) <= -1 &&
                expiry_value &&
                this.config.sh_restrict_lot_expiry
            ) {
                this.popup.add(ErrorPopup, {
                    title: "Expiry Warning",
                    body:
                        "You can't sell it, Because Lot/Serial Number " +
                        lotName +
                        " of " +
                        productName +
                        " has been expired on " +
                        expiry_date?.toLocaleDateString()
                });
                return;
            } else if (
                -1 < daysDifference &&
                Math.round(daysDifference) <= daysToAdd &&
                expiry_value &&
                this.config.sh_lot_expiry_warning
            ) {
                let _confirmed = await this.popup.add(ConfirmPopup, {
                    title: "Alert Warning",
                    body:
                        "The Lot/Serial Number " +
                        lotName +
                        " of " +
                        productName +
                        " will expire on " +
                        expiry_date?.toLocaleDateString(),
                });
                console.log(_confirmed);
                
                if (!_confirmed.confirmed) {
                    return;
                }
            }
        }
        return result;
    },
});

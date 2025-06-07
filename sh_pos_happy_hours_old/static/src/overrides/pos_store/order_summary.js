/** @odoo-module */

// import { OrderSummary } from "@point_of_sale/app/screens/product_screen/order_summary/order_summary";
import { ProductScreen } from "@point_of_sale/app/screens/product_screen/product_screen";
import { patch } from "@web/core/utils/patch";

patch(ProductScreen.prototype, {
    _setValue(val) {
        let happy_hours_id = this.pos.config.sh_happy_hours_id;
        let result = super._setValue(val);

        if (happy_hours_id && this.pos.sh_sale_hours()) {
            if (val != "remove" && val != "") {
                this.pos.sh_check_quantity();
            } else if (val == "" || val == "remove") {
                this.pos.sh_update_reward_qty();
            }
        }
        return result;
    },
});

/** @odoo-module */

import { Order } from "@point_of_sale/app/store/models";
import { patch } from "@web/core/utils/patch";

patch(Order.prototype,{
    async add_product(product, options){
        let result= await super.add_product(product, options)
        let happy_hours_id_config = this.pos.config.sh_happy_hours_id[0];        
        let happy_hours_id=this.env.services.pos.sh_happy_hour_by_id[happy_hours_id_config]
        console.log("result",result);
        if (
            this.pos.sh_sale_hours() &&
            // this.pos.sh_check_customer() &&
            happy_hours_id
        ) {
            await this.pos.sh_check_quantity();

            if (
                happy_hours_id.sh_discount_on_product &&
                happy_hours_id.sh_product_ids.length > 0
            ) {
                let products = happy_hours_id.sh_product_ids;
                for (let index = 0; index < products.length; index++) {
                    const sh_product = products[index];
                    console.log("same pro",sh_product,product.id);
                    if (sh_product == product.id) {
                        result.set_discount(happy_hours_id.sh_discount);
                        result["sh_sale_lable"]="Discounted Product"
                    }
                }
            }
            if (
                happy_hours_id.sh_set_pricelist &&
                happy_hours_id.sh_offer_pricelist_id
            ) {
                result.order.id.set_pricelist(happy_hours_id.sh_offer_pricelist_id);
            }
        }
        return result;
    }
})
/** @odoo-module */

import { ProductScreen } from "@point_of_sale/app/screens/product_screen/product_screen";
import { patch } from "@web/core/utils/patch";

patch(ProductScreen.prototype, {
    get products() {
        let result = super.products;
        let happy_hours_id = this.pos.config.sh_happy_hours_id;
        
        if (happy_hours_id) {
            for (let index = 0; index < result.length; index++) {
                const product = result[index];
                for (let sub_index = 0; sub_index < happy_hours_id.sh_packlist_ids?.length; sub_index++) {
                    const pack = happy_hours_id.sh_packlist_ids[sub_index];
                    if (pack.sh_product_id.id==product.id) {
                        product["sh_sale_lable"]=`Pack product ${pack.sh_quantity}+`
                    }
                }
                for (let sub_index = 0; sub_index < happy_hours_id.sh_one_free_product_ids?.length; sub_index++) {
                    const pack = happy_hours_id.sh_one_free_product_ids[sub_index];
                    if (pack.sh_product_id.id==product.id) {
                        product["sh_sale_lable"]=`Free product ${pack.sh_quantity}+`
                    }
                }
                for (let sub_index = 0; sub_index < happy_hours_id.sh_product_ids?.length; sub_index++) {
                    const pack = happy_hours_id.sh_product_ids[sub_index];
                    if (pack.id==product.id) {
                        product["sh_sale_lable"]=`Discounted product`
                    }
                }

            }
        }
        return result;
    },
});

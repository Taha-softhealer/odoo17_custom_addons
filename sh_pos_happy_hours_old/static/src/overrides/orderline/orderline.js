/** @odoo-module */

import { Orderline } from "@point_of_sale/app/generic_components/orderline/orderline";
// import { PosOrderline } from "@point_of_sale/app/models/pos_order_line";
import { patch } from "@web/core/utils/patch";

patch(Orderline, {
    props: {
        ...Orderline.props,
        line: {
            ...Orderline.props.line,
            shape: {
                ...Orderline.props.line.shape,
                sh_sale_lable: { type: String, optional: true },
            },
        },
    },
});


// patch(PosOrderline.prototype, {
//     getSaleLable(){
//         return this.sh_sale_lable
//     },
    
//     getDisplayData() {
//         return {
//             ...super.getDisplayData(),
//             sh_sale_lable:this.getSaleLable()
//         };
//     },
// });


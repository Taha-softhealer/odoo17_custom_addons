/** @odoo-module */

import { PosStore } from "@point_of_sale/app/store/pos_store";
import { patch } from "@web/core/utils/patch";
import { serializeDateTime } from "@web/core/l10n/dates";
const { DateTime } = luxon;

patch(PosStore.prototype, {
    async _processData(loadedData) {
        await super._processData(...arguments);
        this.sh_happy_hour_by_id = loadedData["sh_happy_hour_by_id"];
        this.sh_available_pack_pricelist_lines_id =
            loadedData["sh_available_pack_pricelist_lines_id"];
        this.sh_get_one_product_free_id =
            loadedData["sh_get_one_product_free_id"];
    },

    sh_convert_num_to_time(number, period) {
        var sign = number >= 0 ? 1 : -1;
        number = number * sign;

        var hour = Math.floor(number);
        var decpart = number - hour;
        var min = 1 / 60;
        decpart = min * Math.round(decpart / min);

        var minute = Math.floor(decpart * 60);
        if (minute < 10) {
            minute = "0" + minute;
        }

        if (period === "am" && hour === 12) {
            hour = 0;
        } else if (period === "pm" && hour !== 12) {
            hour += 12;
        }
        var floatTime = hour + minute / 60;
        return sign * floatTime;
    },

    sh_sale_hours() {
        let happy_hours_id_config = this.config.sh_happy_hours_id[0];
        // let date = serializeDateTime(DateTime.now());
        // console.log("starting str1",happy_hours_id_config);

        let happy_hours_id = this.sh_happy_hour_by_id[happy_hours_id_config];
        // console.log("starting str",happy_hours_id);
        let date = new Date();
        if (happy_hours_id) {
            if (!happy_hours_id.sh_everyday) {
                let starting_str = happy_hours_id.sh_starting_duration;
                let ending_str = happy_hours_id.sh_ending_duration;
                // console.log("starting str",starting_str);
                // console.log("starting str",ending_str);

                let starting_date = new Date(
                    starting_str.replace(" ", "T") + "Z"
                );
                let ending_date = new Date(ending_str.replace(" ", "T") + "Z");

                if (date >= starting_date && date <= ending_date) {
                    return true;
                } else {
                    return false;
                }
            } else {
                let currentTime = date.getHours() + date.getMinutes() / 60;
                let starting_time = this.sh_convert_num_to_time(
                    happy_hours_id.sh_starting_time,
                    happy_hours_id.sh_starting_type
                );
                let ending_time = this.sh_convert_num_to_time(
                    happy_hours_id.sh_ending_time,
                    happy_hours_id.sh_ending_type
                );
                if (
                    currentTime >= starting_time &&
                    currentTime <= ending_time
                ) {
                    return true;
                } else {
                    return false;
                }
            }
        }
    },

    async sh_check_quantity() {
        let happy_hours_id_config = this.config.sh_happy_hours_id[0];
        let happy_hours_id =
            this.env.services.pos.sh_happy_hour_by_id[happy_hours_id_config];
        let reward_lines_id;
        let reward_lines = [];
        console.log("reaching here", happy_hours_id_config);

        if (
            happy_hours_id &&
            happy_hours_id.sh_set_pack_pricelist &&
            happy_hours_id.sh_packlist_ids.length > 0
        ) {
            for (
                let index = 0;
                index < happy_hours_id.sh_packlist_ids.length;
                index++
            ) {
                reward_lines_id = happy_hours_id.sh_packlist_ids[index];
                reward_lines.push(
                    this.sh_available_pack_pricelist_lines_id[reward_lines_id]
                );
            }
            console.log(reward_lines);

            // await this._sh_check_quantity(reward_lines, false);
            reward_lines=[]
        }

        if (
            happy_hours_id &&
            happy_hours_id.sh_buy_x_get_1_extra &&
            happy_hours_id.sh_one_free_product_ids.length > 0
        ) {
            for (
                let index = 0;
                index < happy_hours_id.sh_packlist_ids.length;
                index++
            ) {
                reward_lines_id = happy_hours_id.sh_one_free_product_ids[index];
                console.log("reward line id",reward_lines_id);
                
                reward_lines.push(
                    this.sh_get_one_product_free_id[reward_lines_id]
                );
                console.log("rewardine",reward_lines);
                
            }
            await this._sh_check_quantity(reward_lines, true);
        }
    },

    async _sh_check_quantity(reward_lines, buyXget1) {
        let order = this.get_order();
        let SelectedLine = order.get_selected_orderline();
        let vals;
        let freePackLine = order.lines?.filter((line) => {
            return (
                SelectedLine?.product?.id ==
                line?.sh_free_pack_product_of_id?.id
            );
        });
        console.log("freepack", freePackLine);

        console.log("thissss", reward_lines);

        for (let j = 0; j < reward_lines.length; j++) {
            const pack = reward_lines[j];
            console.log("reward line", SelectedLine, pack);
            // console.log(
            //     "pack.sh_product_id[0] == SelectedLine?.product.id && SelectedLine?.qty >= pack.sh_quantity",
            //     pack.sh_product_id[0],
            //     SelectedLine?.product.id,
            //     SelectedLine?.quantity,
            //     pack.sh_quantity
            // );

            if (
                pack.sh_product_id[0] == SelectedLine?.product.id &&
                SelectedLine?.quantity >= pack.sh_quantity
            ) {
                if (
                    freePackLine &&
                    freePackLine[0] &&
                    typeof freePackLine[0].qty === "number"
                ) {
                    freePackLine[0].qty = Math.floor(
                        SelectedLine?.qty / pack.sh_quantity
                    );
                } else {
                    let option = { price: 0,
                        Quantity :Math.floor(SelectedLine?.quantity / pack.sh_quantity) || 1,
                        sh_free_pack_product:true,
                        sh_free_pack_product_of_id:SelectedLine?.product.id,
                        sh_sale_lable:`Free product of ${SelectedLine?.product.name}`,
                        sh_free:true
                    };
                    if (option.sh_free) {
                        option["sh_free"]=false
                        console.log("===============>>>>>>>>>>>",option.sh_free);
                        
                        let product = buyXget1 ? this.db.product_by_id[SelectedLine.product.id] : this.db.product_by_id[pack.sh_pack_product_id[0]];
                        let newln = await this.get_order().add_product(
                            product,
                            option
                        );
                        
                    }else{
                        option["sh_free"]=false
                    }
                    console.log("reaching to the add product",option);
                    // newln.price = 0;
                    console.log("newln", newln);
                    // return newln;
                }
            } else if (
                freePackLine &&
                freePackLine[0] &&
                typeof freePackLine[0].qty === "number" &&
                SelectedLine?.qty < pack.sh_quantity
            ) {
                order.removeOrderline(freePackLine[0]);
            }
        }
    },


    // async addLineToOrder(vals, order, opts = {}, configure = true) {
    //     let happy_hours_id = this.config.sh_happy_hours_id;
    //     let result = await super.addLineToOrder(
    //         vals,
    //         order,
    //         (opts = {}),
    //         (configure = true)
    //     );
    //     if (
    //         this.sh_sale_hours() &&
    //         this.sh_check_customer() &&
    //         happy_hours_id
    //     ) {
    //         await this.sh_check_quantity();

    //         if (
    //             happy_hours_id.sh_discount_on_product &&
    //             happy_hours_id.sh_product_ids.length > 0
    //         ) {
    //             let products = happy_hours_id.sh_product_ids;
    //             for (let index = 0; index < products.length; index++) {
    //                 const product = products[index];
    //                 if (product.id == vals.product_id.id) {
    //                     result.set_discount(happy_hours_id.sh_discount);
    //                     result["sh_sale_lable"]="Discounted Product"
    //                 }
    //             }
    //         }
    //         if (
    //             happy_hours_id.sh_set_pricelist &&
    //             happy_hours_id.sh_offer_pricelist_id
    //         ) {
    //             order.set_pricelist(happy_hours_id.sh_offer_pricelist_id);
    //         }
    //     }
    //     return result;
    // },

    // async sh_update_reward_qty() {
    //     let happy_hours_id = this.config.sh_happy_hours_id;
    //     let reward_lines;
    //     if (
    //         happy_hours_id &&
    //         happy_hours_id.sh_set_pack_pricelist &&
    //         happy_hours_id.sh_packlist_ids.length > 0
    //     ) {
    //         reward_lines = happy_hours_id.sh_packlist_ids;
    //         this._sh_update_reward_qty(reward_lines);
    //     }

    //     if (
    //         happy_hours_id &&
    //         happy_hours_id.sh_buy_x_get_1_extra &&
    //         happy_hours_id.sh_one_free_product_ids.length > 0
    //     ) {
    //         reward_lines = happy_hours_id.sh_one_free_product_ids;
    //         this._sh_update_reward_qty(reward_lines);
    //     }
    // },

    // _sh_update_reward_qty(reward_lines) {
    //     let order = this.get_order();
    //     let SelectedLine = order.get_selected_orderline();

    //     let freePackLine = order.lines?.filter((line) => {
    //         return (
    //             SelectedLine?.product_id?.id ==
    //             line?.sh_free_pack_product_of_id?.id
    //         );
    //     });

    //     for (let j = 0; j < reward_lines.length; j++) {
    //         const pack = reward_lines[j];
    //         if (
    //             pack.sh_product_id.id == SelectedLine?.product_id?.id &&
    //             SelectedLine?.qty >= pack.sh_quantity
    //         ) {
    //             if (
    //                 freePackLine[0] &&
    //                 typeof freePackLine[0].qty === "number"
    //             ) {
    //                 freePackLine[0].qty = Math.floor(
    //                     SelectedLine?.qty / pack.sh_quantity
    //                 );
    //             }
    //         } else if (
    //             freePackLine[0] &&
    //             typeof freePackLine[0].qty === "number" &&
    //             SelectedLine?.qty < pack.sh_quantity
    //         ) {
    //             order.removeOrderline(freePackLine[0]);
    //         }
    //     }
    // },

    // sh_check_customer() {
    //     let happy_hours_id = this.config.sh_happy_hours_id;
    //     if (!happy_hours_id) {
    //         return true;
    //     }

    //     const order = this.get_order();
    //     const partner = order?.get_partner();

    //     const {
    //         sh_not_apply_wo_customer,
    //         sh_set_on_all_customer,
    //         sh_set_on_customer_with_x_order,
    //         sh_pos_order_count,
    //     } = happy_hours_id;

    //     if (sh_not_apply_wo_customer) {
    //         if (!partner) {
    //             return false;
    //         }

    //         if (sh_set_on_all_customer) {
    //             const orderCount = partner.pos_order_count;
    //             if (sh_set_on_customer_with_x_order) {
    //                 return orderCount >= sh_pos_order_count;
    //             }

    //             return true;
    //         }

    //         return true;
    //     }

    //     return true;
    // },

    // //if partner is selected after the or between the order
    // async selectPartner() {
    //     let happy_hours_id = this.config.sh_happy_hours_id;
    //     let result = await super.selectPartner();
    //     let vals;
    //     const currentOrder = this.get_order();
    //     const orderlines = currentOrder.lines;
    //     const partner = currentOrder.get_partner();

    //     if (
    //         this.sh_check_customer() &&
    //         this.sh_sale_hours() &&
    //         happy_hours_id &&
    //         partner &&
    //         !result
    //     ) {
    //         for (let index = 0; index < orderlines.length; index++) {
    //             const orderline = orderlines[index];
    //             if (
    //                 happy_hours_id.sh_set_pack_pricelist &&
    //                 happy_hours_id.sh_packlist_ids.length > 0
    //             ) {
    //                 let packlist = happy_hours_id.sh_packlist_ids;
    //                 for (
    //                     let sub_index = 0;
    //                     sub_index < packlist.length;
    //                     sub_index++
    //                 ) {
    //                     const pack = packlist[sub_index];
    //                     if (
    //                         orderline.product_id.id == pack.sh_product_id.id &&
    //                         orderline.qty >= pack.sh_quantity
    //                     ) {
    //                         vals = {
    //                             product_id: pack.sh_pack_product_id,
    //                         };
    //                         vals["price_unit"] = 0;
    //                         vals["qty"] =
    //                             Math.floor(orderline?.qty / pack.sh_quantity) ||
    //                             1;
    //                         vals["sh_free_pack_product"] = true;
    //                         vals["sh_free_pack_product_of_id"] =
    //                             orderline?.product_id;
    //                         vals[
    //                             "sh_sale_lable"
    //                         ] = `Free product of ${orderline?.product_id.name}`;

    //                         let opts;
    //                         let configure;
    //                         let newline = await super.addLineToOrder(
    //                             vals,
    //                             currentOrder,
    //                             (opts = {}),
    //                             (configure = true)
    //                         );
    //                     }
    //                 }
    //             }
    //             if (
    //                 happy_hours_id.sh_buy_x_get_1_extra &&
    //                 happy_hours_id.sh_one_free_product_ids.length > 0
    //             ) {
    //                 let extraproducts = happy_hours_id.sh_one_free_product_ids;
    //                 for (
    //                     let sub_index = 0;
    //                     sub_index < extraproducts.length;
    //                     sub_index++
    //                 ) {
    //                     const extraproduct = extraproducts[sub_index];
    //                     if (
    //                         orderline.product_id.id ==
    //                             extraproduct.sh_product_id.id &&
    //                         orderline.qty >= extraproduct.sh_quantity
    //                     ) {
    //                         vals = {
    //                             product_id: orderline.product_id,
    //                         };
    //                         vals["price_unit"] = 0;
    //                         vals["qty"] =
    //                             Math.floor(
    //                                 orderline?.qty / extraproduct.sh_quantity
    //                             ) || 1;
    //                         vals["sh_free_pack_product"] = true;
    //                         vals["sh_free_pack_product_of_id"] =
    //                             orderline?.product_id;
    //                         vals[
    //                             "sh_sale_lable"
    //                         ] = `Free product of ${orderline?.product_id.name}`;

    //                         let opts;
    //                         let configure;
    //                         let newline = await super.addLineToOrder(
    //                             vals,
    //                             currentOrder,
    //                             (opts = {}),
    //                             (configure = true)
    //                         );
    //                     }
    //                 }
    //             }
    //             if (
    //                 happy_hours_id.sh_discount_on_product &&
    //                 happy_hours_id.sh_product_ids.length > 0
    //             ) {
    //                 let products = happy_hours_id.sh_product_ids;
    //                 for (let index = 0; index < products.length; index++) {
    //                     const product = products[index];
    //                     if (
    //                         product.id == orderline?.product_id?.id &&
    //                         orderline.price_unit != 0
    //                     ) {
    //                         orderline?.set_discount(happy_hours_id.sh_discount);
    //                         orderline["sh_sale_lable"]="Discounted Product"
    //                     }
    //                 }
    //             }
    //             if (
    //                 happy_hours_id.sh_set_pricelist &&
    //                 happy_hours_id.sh_offer_pricelist_id
    //             ) {
    //                 currentOrder.set_pricelist(
    //                     happy_hours_id.sh_offer_pricelist_id
    //                 );
    //             }
    //         }
    //     } else if (this.sh_sale_hours() && happy_hours_id && !partner) {
    //         for (let index = 0; index < orderlines.length; index++) {
    //             const orderline = orderlines[index];
    //             if (
    //                 happy_hours_id.sh_discount_on_product &&
    //                 happy_hours_id.sh_product_ids.length > 0
    //             ) {
    //                 let products = happy_hours_id.sh_product_ids;
    //                 for (let index = 0; index < products.length; index++) {
    //                     const product = products[index];
    //                     if (
    //                         product.id == orderline?.product_id?.id &&
    //                         orderline.price_unit != 0
    //                     ) {
    //                         orderline?.set_discount(0);
    //                     }
    //                 }
    //             }
    //             if (
    //                 happy_hours_id.sh_set_pricelist &&
    //                 happy_hours_id.sh_offer_pricelist_id
    //             ) {
    //                 currentOrder.set_pricelist(this.config.pricelist_id);
    //             }
    //         }
    //         let removeline = orderlines.filter(
    //             (line) => line.sh_free_pack_product == true
    //         );
    //         removeline.forEach((line) => {
    //             currentOrder.removeOrderline(line);
    //         });
    //     }
    //     return result;
    // },
});

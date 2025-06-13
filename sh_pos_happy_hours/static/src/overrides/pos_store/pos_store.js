/** @odoo-module */

import { PosStore } from "@point_of_sale/app/store/pos_store";
import { patch } from "@web/core/utils/patch";

patch(PosStore.prototype, {
    async _processData(loadedData) {
        await super._processData(...arguments);
        this.sh_happy_hour_by_id = loadedData["sh_happy_hour_by_id"];
        this.sh_available_pack_pricelist_lines_id =
            loadedData["sh_available_pack_pricelist_lines_id"];
        this.sh_get_one_product_free_id =
            loadedData["sh_get_one_product_free_id"];
        this.sh_pricelist_by_id = loadedData["sh_pricelist_by_id"];
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
        // console.log("reaching here", happy_hours_id_config);

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
            // console.log(reward_lines);

            await this._sh_check_quantity(reward_lines, false);
            reward_lines = [];
        }

        if (
            happy_hours_id &&
            happy_hours_id.sh_buy_x_get_1_extra &&
            happy_hours_id.sh_one_free_product_ids.length > 0
        ) {
            for (
                let index = 0;
                index < happy_hours_id.sh_one_free_product_ids.length;
                index++
            ) {
                reward_lines_id = happy_hours_id.sh_one_free_product_ids[index];
                // console.log("reward line id", reward_lines_id);

                reward_lines.push(
                    this.sh_get_one_product_free_id[reward_lines_id]
                );
                // console.log("rewardine", reward_lines);
            }
            await this._sh_check_quantity(reward_lines, true);
            reward_lines = [];
        }
    },

    async _sh_check_quantity(reward_lines, buyXget1) {
        console.log("54");

        let order = this.get_order();
        let SelectedLine = order.get_selected_orderline();

        let freePackLine = order.get_orderlines()?.filter((line) => {
            return (
                SelectedLine?.product?.id == line?.sh_free_pack_product_of_id
            );
        });
        // console.log("freepack", freePackLine);

        // console.log("thissss", reward_lines);

        for (let j = 0; j < reward_lines.length; j++) {
            const pack = reward_lines[j];
            // console.log("reward line", SelectedLine, pack);

            if (
                pack.sh_product_id[0] == SelectedLine?.product.id &&
                SelectedLine?.quantity >= pack.sh_quantity
            ) {
                if (
                    freePackLine &&
                    freePackLine[0] &&
                    typeof freePackLine[0].quantity === "number"
                ) {
                    console.log(
                        "setting free pack",
                        Math.floor(SelectedLine?.quantity / pack.sh_quantity)
                    );

                    freePackLine[0].set_quantity(
                        Math.floor(SelectedLine?.quantity / pack.sh_quantity)
                    );
                    break;
                } else {
                    let option = {
                        price: 0,
                        Quantity:
                            Math.floor(
                                SelectedLine?.quantity / pack.sh_quantity
                            ) || 1,
                        extras: {
                            sh_free_pack_product: true,
                            price_type: "manual",
                            sh_free_pack_product_of_id: SelectedLine.product.id,
                            sh_sale_lable: `Free product of ${SelectedLine?.product.name}`,
                        },
                        sh_check_quantity: true,
                        merge: false,
                    };

                    let product = buyXget1
                        ? this.db.product_by_id[SelectedLine.product.id]
                        : this.db.product_by_id[pack?.sh_pack_product_id[0]];
                    let newln = await this.get_order().add_product(
                        product,
                        option
                    );
                    // console.log("reaching to the add product", option);
                    // console.log("newln", newln);
                }
            }
            //   else if (
            //     freePackLine &&
            //     freePackLine[0] &&
            //     typeof freePackLine[0].quantity === "number" &&
            //     SelectedLine?.quantity < pack.sh_quantity
            // ) {
            //     console.log("selected",SelectedLine);
            //     console.log("pack",pack);

            //     console.log("yes removing orderline");

            //     order.removeOrderline(freePackLine[0]);
            // }
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

    async sh_update_reward_qty() {
        console.log("24345");

        let happy_hours_id_config = this.config.sh_happy_hours_id[0];
        let happy_hours_id =
            this.env.services.pos.sh_happy_hour_by_id[happy_hours_id_config];
        let reward_lines_id;
        let reward_lines = [];
        // console.log("reaching here", happy_hours_id_config);
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
            // console.log(reward_lines);

            await this._sh_update_reward_qty(reward_lines);
            reward_lines = [];
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
                // console.log("reward line id", reward_lines_id);

                reward_lines.push(
                    this.sh_get_one_product_free_id[reward_lines_id]
                );
                // console.log("rewardine", reward_lines);
            }
            await this._sh_update_reward_qty(reward_lines);
            reward_lines = [];
        }
    },

    _sh_update_reward_qty(reward_lines) {
        console.log("fdgfdg");

        let order = this.get_order();
        let SelectedLine = order.get_selected_orderline();

        let freePackLine = order.get_orderlines()?.filter((line) => {
            return (
                SelectedLine?.product?.id == line?.sh_free_pack_product_of_id
            );
        });

        for (let j = 0; j < reward_lines.length; j++) {
            const pack = reward_lines[j];
            if (
                pack.sh_product_id[0] == SelectedLine?.product?.id &&
                SelectedLine?.quantity >= pack.sh_quantity
            ) {
                if (
                    freePackLine[0] &&
                    typeof freePackLine[0].quantity === "number"
                ) {
                    freePackLine[0].set_quantity(
                        Math.floor(SelectedLine?.quantity / pack.sh_quantity)
                    );
                }
            } else if (
                freePackLine &&
                freePackLine[0] &&
                typeof freePackLine[0].quantity === "number" &&
                SelectedLine?.quantity < pack.sh_quantity
            ) {
                order.removeOrderline(freePackLine[0]);
            }
        }
    },

    sh_check_customer() {
        let happy_hours_id_config = this.config.sh_happy_hours_id[0];
        let happy_hours_id =
            this.env.services.pos.sh_happy_hour_by_id[happy_hours_id_config];
        if (!happy_hours_id || !happy_hours_id_config) {
            return true;
        }

        const order = this.get_order();
        const partner = order?.get_partner();

        const {
            sh_not_apply_wo_customer,
            sh_set_on_all_customer,
            sh_set_on_customer_with_x_order,
            sh_pos_order_count,
        } = happy_hours_id;
        // console.log("happy hour id in custo", happy_hours_id);
        // console.log("happy hour id in partner", partner);

        if (sh_not_apply_wo_customer) {
            if (!partner) {
                return false;
            }

            if (sh_set_on_all_customer) {
                const orderCount = partner.pos_order_count;
                if (sh_set_on_customer_with_x_order) {
                    return orderCount >= sh_pos_order_count;
                }
                return true;
            }

            return true;
        }

        return true;
    },

    //if partner is selected after or between the order
    async selectPartner() {
        let happy_hours_id_config = this.config.sh_happy_hours_id[0];
        let happy_hours_id =
            this.env.services.pos.sh_happy_hour_by_id[happy_hours_id_config];
        let result = await super.selectPartner();
        const currentOrder = this.get_order();
        const orderlines = currentOrder.get_orderlines();
        const partner = currentOrder.get_partner();
        let reward_pack = [];
        let reward_buy1get = [];
        let reward_lines_id;

        if (
            this.sh_check_customer() &&
            this.sh_sale_hours() &&
            happy_hours_id &&
            partner &&
            !result
        ) {
            for (
                let index = 0;
                index < happy_hours_id.sh_one_free_product_ids.length;
                index++
            ) {
                reward_lines_id = happy_hours_id.sh_one_free_product_ids[index];
                reward_buy1get.push(
                    this.sh_get_one_product_free_id[reward_lines_id]
                );
            }
            for (
                let index = 0;
                index < happy_hours_id.sh_packlist_ids.length;
                index++
            ) {
                reward_lines_id = happy_hours_id.sh_packlist_ids[index];
                reward_pack.push(
                    this.sh_available_pack_pricelist_lines_id[reward_lines_id]
                );
            }
            // console.log("calling the slee", currentOrder);
            for (let index = 0; index < orderlines?.length; index++) {
                const orderline = orderlines[index];
                // console.log(
                // "happy_hours_id.sh_set_pack_pricelist",
                // happy_hours_id.sh_set_pack_pricelist
                // );
                // console.log(
                // "happy_hours_id.sh_packlist_ids",
                // happy_hours_id.sh_packlist_ids
                // );
                if (
                    happy_hours_id.sh_discount_on_product &&
                    happy_hours_id.sh_product_ids.length > 0
                ) {
                    let products = happy_hours_id.sh_product_ids;
                    for (let index = 0; index < products.length; index++) {
                        const product = products[index];
                        if (
                            product == orderline?.product?.id &&
                            orderline.price_unit != 0
                        ) {
                            orderline?.set_discount(happy_hours_id.sh_discount);
                            orderline["sh_sale_lable"] = "Discounted Product";
                        }
                    }
                }
                if (
                    happy_hours_id.sh_set_pack_pricelist &&
                    happy_hours_id.sh_packlist_ids.length > 0
                ) {
                    // console.log("inside the customer packprst",reward_pack);
                    for (
                        let sub_index = 0;
                        sub_index < reward_pack.length;
                        sub_index++
                    ) {
                        const pack = reward_pack[sub_index];
                        if (
                            orderline.product.id == pack.sh_product_id[0] &&
                            orderline.quantity >= pack.sh_quantity
                        ) {
                            let option = {
                                price: 0,
                                Quantity:
                                    Math.floor(
                                        orderline?.quantity / pack.sh_quantity
                                    ) || 1,
                                extras: {
                                    sh_free_pack_product: true,
                                    price_type: "manual",
                                    sh_free_pack_product_of_id:
                                        orderline?.product.id,
                                    sh_sale_lable: `Free product of ${orderline?.product.name}`,
                                },
                                sh_check_quantity: true,
                                merge: false,
                            };
                            let product =
                                this.db.product_by_id[
                                    pack?.sh_pack_product_id[0]
                                ];
                            let newln = await this.get_order().add_product(
                                product,
                                option
                            );
                            // console.log("reaching to the add product", option);
                            // console.log("newln", newln);
                        }
                    }
                }
                if (
                    happy_hours_id.sh_buy_x_get_1_extra &&
                    happy_hours_id.sh_one_free_product_ids.length > 0
                ) {
                    // console.log("happy_hours_id.sh_one_free_product_ids",happy_hours_id.sh_one_free_product_ids);
                    // console.log("reward buy1get1",reward_buy1get);
                    for (
                        let sub_index = 0;
                        sub_index < reward_buy1get.length;
                        sub_index++
                    ) {
                        const extraproduct = reward_buy1get[sub_index];
                        if (
                            orderline.product.id ==
                                extraproduct.sh_product_id[0] &&
                            orderline.quantity >= extraproduct.sh_quantity
                        ) {
                            // console.log("extraproduct",extraproduct);

                            let option = {
                                price: 0,
                                Quantity:
                                    Math.floor(
                                        orderline?.quantity /
                                            extraproduct.sh_quantity
                                    ) || 1,
                                extras: {
                                    sh_free_pack_product: true,
                                    price_type: "manual",
                                    sh_free_pack_product_of_id:
                                        orderline?.product.id,
                                    sh_sale_lable: `Free product of ${orderline?.product.name}`,
                                },
                                sh_check_quantity: true,
                                merge: false,
                            };
                            let product =
                                this.db.product_by_id[orderline.product.id];
                            let newln = await this.get_order().add_product(
                                product,
                                option
                            );
                            // console.log("reaching to the add product buy1get", option);
                            // console.log("newln", newln);
                        }
                    }
                }
                console.log(
                    "happy hour pricelisrt",
                    happy_hours_id.sh_offer_pricelist_id
                );
            }
            if (
                happy_hours_id.sh_set_pricelist &&
                happy_hours_id.sh_offer_pricelist_id
            ) {
                currentOrder.set_pricelist(
                    this.sh_pricelist_by_id[
                        happy_hours_id.sh_offer_pricelist_id[0]
                    ]
                );
            }
        } else if (this.sh_sale_hours() && happy_hours_id && !partner) {
            for (let index = 0; index < orderlines?.length; index++) {
                const orderline = orderlines[index];
                if (
                    happy_hours_id.sh_discount_on_product &&
                    happy_hours_id.sh_product_ids.length > 0
                ) {
                    let products = happy_hours_id.sh_product_ids;
                    for (let index = 0; index < products.length; index++) {
                        const product = products[index];
                        if (
                            product.id == orderline?.product_id?.id &&
                            orderline.price_unit != 0
                        ) {
                            orderline?.set_discount(0);
                        }
                    }
                }
                if (
                    happy_hours_id.sh_set_pricelist &&
                    happy_hours_id.sh_offer_pricelist_id
                ) {
                    currentOrder.set_pricelist(this.config.pricelist_id[0]);
                }
            }
            let removeline = orderlines?.filter(
                (line) => line.sh_free_pack_product == true
            );
            removeline?.forEach((line) => {
                currentOrder.removeOrderline(line);
            });
        }
        return result;
    },
});

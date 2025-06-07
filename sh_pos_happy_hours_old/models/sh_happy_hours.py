# -*- coding: utf-8 -*-
# Part of Softhealer Technologies. See LICENSE file for full copyright and licensing details.
from odoo import api, fields, models
from odoo.exceptions import UserError


class ShHappyHours(models.Model):
    _name = "sh.happy.hours"
    _description = "Sh Happy Hours Discount"

    name = fields.Char(string="Offer", required=True)
    sh_everyday = fields.Boolean(string="Every day")
    sh_starting_time = fields.Float("Starting Time")
    sh_starting_type = fields.Selection([("am", "AM"), ("pm", "PM")])
    sh_ending_time = fields.Float("Ending Time")
    sh_ending_type = fields.Selection([("am", "AM"), ("pm", "PM")])
    sh_starting_duration = fields.Datetime("Starting Time")
    sh_ending_duration = fields.Datetime("Ending Time")
    sh_discount_on_product = fields.Boolean("Set Discount On Products")
    sh_product_ids = fields.Many2many("product.product", string="Products")
    sh_discount = fields.Float(string="Discount %")
    sh_set_pricelist = fields.Boolean("Set Pricelist")
    sh_offer_pricelist_id = fields.Many2one(
        "product.pricelist",
        string="Offer Pricelist",
    )
    sh_set_pack_pricelist = fields.Boolean("Set Pack Pricelist")
    sh_packlist_ids = fields.One2many(
        "sh.available.pack.pricelist.lines",
        "sh_happy_hour_id",
        string="Availabe Packlist",
    )
    sh_buy_x_get_1_extra = fields.Boolean(
        "Buy 'X' quantities of Product to get 1 Product Extra"
    )
    sh_one_free_product_ids = fields.One2many(
        "sh.get.one.product.free", "sh_happy_hour_id", string="Products"
    )
    sh_not_apply_wo_customer = fields.Boolean(
        "Not apply Offer on Order without Customer"
    )
    sh_set_on_all_customer = fields.Boolean("Set on all customers")
    sh_set_on_customer_with_x_order = fields.Boolean(
        "Set on customers with minimum 'X' order"
    )
    sh_pos_order_count = fields.Integer("POS Order Count")

    @api.onchange("sh_starting_time", "sh_ending_time")
    def onchange_sh_starting_time(self):
        if self.sh_starting_time > 12 or self.sh_starting_time < 0 or self.sh_ending_time > 12 or self.sh_ending_time < 0:
            raise UserError("You can not set timing more than 12 or less than 0.")

    # @api.model
    # def _load_pos_data_domain(self, data):
    #     return []

    # @api.model
    # def _load_pos_data_fields(self, config_id):
    #     return []

    # def _load_pos_data(self, data):
    #     domain = self._load_pos_data_domain(data)
    #     fields = self._load_pos_data_fields(data["pos.config"]["data"][0]["id"])
    #     return {
    #         "data": (
    #             self.search_read(domain, fields, load=False)
    #             if domain is not False
    #             else []
    #         ),
    #         "fields": fields,
    #     }
# -*- coding: utf-8 -*-
# Part of Softhealer Technologies. See LICENSE file for full copyright and licensing details.
from odoo import api, fields, models


class ShAvailablePackPricelistLines(models.Model):
    _name = "sh.available.pack.pricelist.lines"
    _description = "Sh Happy Hours Discount"
    
    name = fields.Char("Name")
    sh_product_id = fields.Many2one(
        "product.product",
        string="Product",
        required=True
    )
    sh_quantity = fields.Integer("Quantity",required=True,default="1")
    sh_pack_product_id = fields.Many2one(
        "product.product",
        string="Pack Product",
        required=True
    )

    sh_happy_hour_id = fields.Many2one(
        "sh.happy.hours",
        string="Happy hour",
    )

class ShGetOneProductFree(models.Model):
    _name = "sh.get.one.product.free"
    _description = "Sh get one product free"

    name = fields.Char("Name")
    sh_happy_hour_id = fields.Many2one(
        "sh.happy.hours",
        string="Happy hour",
    )
    sh_product_id = fields.Many2one(
        "product.product",
        string="Product",
        required=True
    )
    sh_quantity = fields.Integer("Quantity",required=True,default="1")

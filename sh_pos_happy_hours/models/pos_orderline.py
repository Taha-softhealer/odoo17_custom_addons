from odoo import api, fields, models, tools

class PosOrderline(models.Model):
    _inherit = "pos.order.line"

    sh_free_pack_product = fields.Boolean()
    sh_free_pack_product_of_id = fields.Many2one(
        "product.product",
    )
    sh_sale_lable = fields.Char()
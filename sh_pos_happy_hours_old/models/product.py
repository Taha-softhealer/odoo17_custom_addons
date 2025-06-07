from odoo import api, fields, models

class ProductProduct(models.Model):
    _inherit = 'product.product'

    sh_sale_lable = fields.Char()

    def _load_pos_data_fields(self, config_id):
        result=super()._load_pos_data_fields(config_id)
        result+=["sh_sale_lable"]
        return result


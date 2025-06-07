from odoo import api, fields, models

class ProductProduct(models.Model):
    _inherit = 'res.partner'

    def _load_pos_data_fields(self, config_id):
        result=super()._load_pos_data_fields(config_id)
        result+=["pos_order_count"]
        return result


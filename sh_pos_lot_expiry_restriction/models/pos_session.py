from odoo import models


class PosSession(models.Model):
    _inherit = 'pos.session'
    
    def _loader_params_product_product(self):
        result=super()._loader_params_product_product()        
        product_model = self.env['product.product']
        field_names = product_model.fields_get().keys()
        if "alert_time" and "use_expiration_date" in field_names:
            result['search_params']['fields'].extend(["use_expiration_date","alert_time"])
        return result
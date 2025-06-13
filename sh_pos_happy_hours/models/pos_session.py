from odoo import api, fields, models, tools

class PosSession(models.Model):
    _inherit = 'pos.session'
    
    def _pos_data_process(self, loaded_data):
        super()._pos_data_process(loaded_data)
        loaded_data['sh_happy_hour_by_id'] = {sh_happy_hours['id']: sh_happy_hours for sh_happy_hours in loaded_data['sh.happy.hours']}
        loaded_data['sh_available_pack_pricelist_lines_id'] = {sh_available_pack_pricelist_lines['id']: sh_available_pack_pricelist_lines for sh_available_pack_pricelist_lines in loaded_data['sh.available.pack.pricelist.lines']}
        loaded_data['sh_get_one_product_free_id'] = {sh_get_one_product_free['id']: sh_get_one_product_free for sh_get_one_product_free in loaded_data['sh.get.one.product.free']}


    def _pos_ui_models_to_load(self):
        result = super()._pos_ui_models_to_load()
        result+=['sh.happy.hours','sh.available.pack.pricelist.lines','sh.get.one.product.free']
        return result
    

    def _loader_params_sh_happy_hours(self):
        return {
            'search_params': {
                'domain': [],
                'fields': [],
            }
        }
    
    def _loader_params_sh_available_pack_pricelist_lines(self):
        return {
            'search_params': {
                'domain': [],
                'fields': [],
            }
        }
        
    def _loader_params_sh_get_one_product_free(self):
        return {
            'search_params': {
                'domain': [],
                'fields': [],
            }
        }

    def _loader_params_res_partner(self):
        vals = super()._loader_params_res_partner()
        vals["search_params"]["fields"] += ["pos_order_count"]
        return vals



    # def _loader_params_pos_order_line(self):
    #     return {
    #         'search_params': {
    #             'fields': ['id', 'order_id', 'product_id', 'qty', 'sh_free_pack_product','sh_free_pack_product_of_id','sh_sale_lable'],
    #         },
    #     }

    # def _get_pos_ui_pos_order_line(self, params):
    #     return self.env['pos.order.line'].search_read(**params['search_params'])

        
    def _get_pos_ui_sh_happy_hours(self, params):
        return self.env['sh.happy.hours'].search_read(**params['search_params'])
    
    def _get_pos_ui_sh_available_pack_pricelist_lines(self, params):
        return self.env['sh.available.pack.pricelist.lines'].search_read(**params['search_params'])
    
    def _get_pos_ui_sh_get_one_product_free(self, params):
        return self.env['sh.get.one.product.free'].search_read(**params['search_params'])

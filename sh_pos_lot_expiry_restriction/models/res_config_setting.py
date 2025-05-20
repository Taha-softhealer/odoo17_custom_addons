# -*- coding: utf-8 -*-
# Part of Softhealer Technologies. See LICENSE file for full copyright and licensing details.
from odoo import api, fields, models

class PosConfig(models.Model):
    _inherit = 'pos.config'

    sh_lot_expiry_warning = fields.Boolean(string="Display Alert Warning")
    sh_restrict_lot_expiry = fields.Boolean(string="Restrict Expiry Lot")

class ResConfigSettiongsInhert(models.TransientModel):
    _inherit = "res.config.settings"
    
    pos_lot_expiry_warning = fields.Boolean(related="pos_config_id.sh_lot_expiry_warning",readonly=False)
    pos_restrict_lot_expiry = fields.Boolean(related="pos_config_id.sh_restrict_lot_expiry",readonly=False)

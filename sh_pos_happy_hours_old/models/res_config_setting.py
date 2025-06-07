# -*- coding: utf-8 -*-
# Part of Softhealer Technologies. See LICENSE file for full copyright and licensing details.
from odoo import api, fields, models

class PosConfig(models.Model):
    _inherit = 'pos.config'

    sh_happy_hours_id = fields.Many2one(
        'sh.happy.hours',
        string='Happy Hours',
        )

class ResConfigSettiongsInhert(models.TransientModel):
    _inherit = "res.config.settings"
    
    pos_happy_hours_id = fields.Many2one('sh.happy.hours',related="pos_config_id.sh_happy_hours_id",readonly=False)

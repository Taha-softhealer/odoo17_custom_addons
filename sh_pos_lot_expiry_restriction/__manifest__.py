# -*- coding: utf-8 -*-
# Part of Softhealer Technologies. See LICENSE file for full copyright and licensing details.
{
    "name": "Point Of Sale Expiry Lot Restriction",
    "author": "Softhealer Technologies",
    "website": "https://www.softhealer.com",
    "support": "support@softhealer.com",
    "category": "Point Of Sale",
    "license": "OPL-1",
    "summary": "",
    "description": """""",
    "version": "0.0.1",
    "depends": ["point_of_sale"],
    "application": True,
    "data": ["views/res_config_setting.xml"],
    'assets': {
        'point_of_sale._assets_pos': ["sh_pos_lot_expiry_restriction/static/src/overrides/pos_store/pos_store.js"],
    },
    "auto_install": False,
    "installable": True,
}
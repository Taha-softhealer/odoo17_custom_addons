# -*- coding: utf-8 -*-
# Part of Softhealer Technologies. See LICENSE file for full copyright and licensing details.
{
    "name": "Point Of Sale Happy Hour Sale",
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
    "data": ["security/ir.model.access.csv", "views/sh_happy_hours.xml","views/sh_available_pack_pricelist_lines.xml","views/res_config_setting.xml"],
    "assets": {
        "point_of_sale._assets_pos": [
            "sh_pos_happy_hours/static/src/overrides/models/pos_model.js",
            "sh_pos_happy_hours/static/src/overrides/pos_store/pos_store.js",
            "sh_pos_happy_hours/static/src/overrides/pos_store/order_summary.js",
            "sh_pos_happy_hours/static/src/overrides/navbar/navbar.js",
            "sh_pos_happy_hours/static/src/overrides/navbar/navbar.xml"
        ],
    },
    "auto_install": False,
    "installable": True,
}

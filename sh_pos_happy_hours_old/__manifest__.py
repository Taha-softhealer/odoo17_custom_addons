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
    "data": [
        "views/sh_happy_hours.xml",
        "views/res_config_setting.xml",
        "views/sh_available_pack_pricelist_lines.xml",
        "security/ir.model.access.csv",
    ],
    "assets": {
        "point_of_sale._assets_pos": [
            "sh_pos_happy_hours/static/src/overrides/navbar/navbar.xml",
            "sh_pos_happy_hours/static/src/overrides/navbar/navbar.js",
            "sh_pos_happy_hours/static/src/overrides/pos_store/pos_store.js",
            "sh_pos_happy_hours/static/src/overrides/pos_store/order_summary.js",
            "sh_pos_happy_hours/static/src/overrides/product_card/product_card.xml",
            "sh_pos_happy_hours/static/src/overrides/product_card/product_screen.js",
            "sh_pos_happy_hours/static/src/overrides/orderline/orderline.xml",
            "sh_pos_happy_hours/static/src/overrides/orderline/orderline.js",
            "sh_pos_happy_hours/static/src/overrides/pos_store/pos_model.js"
        ],
    },
    "auto_install": False,
    "installable": True,
}

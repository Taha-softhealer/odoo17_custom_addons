# -*- coding: utf-8 -*-
# Part of Softhealer Technologies. See LICENSE file for full copyright and licensing details.
from odoo import api, fields, models
from odoo.tools import float_compare
from odoo.exceptions import UserError, ValidationError


class PosOrderLine(models.Model):
    _inherit = "pos.order.line"

    @api.model
    def sh_get_existing_lots(self, company_id, product):
        self.check_access_rule("read")
        pos_config = self.env["pos.config"].browse(self._context.get("config_id"))
        if not pos_config:
            raise UserError(("No PoS configuration found"))

        src_loc_quants = (
            self.sudo()
            .env["stock.lot"]
            .search(
                [
                    "|",
                    ("company_id", "=", False),
                    ("company_id", "=", company_id),
                    ("product_id", "=", product),
                ]
            )
        )
        print('\n\n\n------------>',product)
        return src_loc_quants.read(["id", "name", "product_qty", "expiration_date"])

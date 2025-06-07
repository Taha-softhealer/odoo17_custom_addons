/** @odoo-module */

import { Navbar } from "@point_of_sale/app/navbar/navbar";
import { patch } from "@web/core/utils/patch";
import { serializeDateTime } from "@web/core/l10n/dates";
const { DateTime } = luxon;

patch(Navbar.prototype, {
    setup() {
        super.setup();
        this.state = { time: this.remaining_time() };
        this.startTimer();
    },

    sh_convert_num_to_time(number, period) {
        var sign = number >= 0 ? 1 : -1;
        number = number * sign;

        var hour = Math.floor(number);
        var decpart = number - hour;
        var min = 1 / 60;
        decpart = min * Math.round(decpart / min);

        var minute = Math.floor(decpart * 60);
        if (minute < 10) {
            minute = "0" + minute;
        }

        if (period === "am" && hour === 12) {
            hour = 0;
        } else if (period === "pm" && hour !== 12) {
            hour += 12;
        }

        return { hour, minute };
    },

    remaining_time_string(remaining_time) {
        let hours = Math.floor(remaining_time / (1000 * 60 * 60));
        let minutes = Math.floor(
            (remaining_time % (1000 * 60 * 60)) / (1000 * 60)
        );
        let seconds = Math.floor((remaining_time % (1000 * 60)) / 1000);
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
            2,
            "0"
        )}:${String(seconds).padStart(2, "0")}`;
    },

    remaining_time() {
        let happy_hours_id_config = this.pos.config.sh_happy_hours_id[0];
        // let date = serializeDateTime(DateTime.now());
        // console.log("starting str",this.env.services.pos.sh_happy_hour);
        
        let happy_hours_id=this.env.services.pos.sh_happy_hour_by_id[happy_hours_id_config]
        // console.log("starting str",happy_hours_id);
        let date = new Date();
        if (this.pos.sh_sale_hours()) {
            if (!happy_hours_id.sh_everyday) {
                let ending_str = happy_hours_id.sh_ending_duration;                
                let ending_date = new Date(ending_str.replace(" ", "T") + "Z");
                if (date <= ending_date) {
                    let remaining_time = ending_date - date;
                    return this.remaining_time_string(remaining_time)
                }
            } else {
                let ending_time = this.sh_convert_num_to_time(
                    happy_hours_id.sh_ending_time,
                    happy_hours_id.sh_ending_type
                );
                let ending_date = new Date();
                ending_date.setHours(
                    ending_time.hour,
                    ending_time.minute,
                    0,
                    0
                );
                if (date <= ending_date) {
                    let remaining_time = ending_date - date;
                    return this.remaining_time_string(remaining_time)
                }
            }
        } else {
            return "00:00:00";
        }
    },

    startTimer() {
        setInterval(() => {
            this.state.time = this.remaining_time();
            this.render();
        }, 1000);
    },
});

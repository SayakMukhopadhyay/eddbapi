/*
 * KodeBlox Copyright 2018 Sayak Mukhopadhyay
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http: //www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";

const mongoose = require('mongoose');
let mongoosePaginate = require('mongoose-paginate');

let populatedSystem = new mongoose.Schema({
    id: { type: Number, unique: true, index: true },
    edsm_id: Number,
    name: String,
    name_lower: { type: String, lowercase: true, index: true },
    x: Number,
    y: Number,
    z: Number,
    population: Number,
    is_populated: Boolean,
    government_id: Number,
    government: { type: String, lowercase: true, index: true },
    allegiance_id: Number,
    allegiance: { type: String, lowercase: true, index: true },
    states: [{
        id: Number,
        name: String,
        name_lower: { type: String, lowercase: true }
    }],
    security_id: Number,
    security: { type: String, lowercase: true, index: true },
    primary_economy_id: Number,
    primary_economy: { type: String, lowercase: true, index: true },
    power: { type: String, lowercase: true, index: true },
    power_state: { type: String, lowercase: true, index: true },
    power_state_id: Number,
    ed_system_address: { type: String, index: true },
    needs_permit: { type: Boolean, index: true },
    updated_at: Date,
    simbad_ref: { type: String, lowercase: true },
    controlling_minor_faction_id: { type: Number, ref: 'faction.id' },
    controlling_minor_faction: { type: String, lowercase: true, ref: 'faction.name_lower', index: true },
    reserve_type_id: Number,
    reserve_type: { type: String, lowercase: true },
    minor_faction_presences: [{
        happiness_id: Number,
        minor_faction_id: Number,
        active_states: [{
            id: Number,
            name: String,
            name_lower: { type: String, lowercase: true }
        }],
        pending_states: [{
            id: Number,
            name: String,
            name_lower: { type: String, lowercase: true }
        }],
        recovering_states: [{
            id: Number,
            name: String,
            name_lower: { type: String, lowercase: true }
        }],
        influence: Number
    }]
}, { runSettersOnQuery: true });

populatedSystem.pre('save', function (next) {
    lowerify(this);
    millisecondify(this);
    next();
});

populatedSystem.pre('findOneAndUpdate', function (next) {
    lowerify(this._update);
    millisecondify(this._update);
    next();
});

populatedSystem.plugin(mongoosePaginate);

let lowerify = ref => {
    ref.name_lower = ref.name;
    if (ref.minor_faction_presences) {
        ref.minor_faction_presences.forEach((faction, index, factions) => {
            factions[index].name_lower = faction.name;
        }, ref);
    }
}

let millisecondify = ref => {
    ref.updated_at *= 1000;
}

module.exports = mongoose.model('populatedSystem', populatedSystem);

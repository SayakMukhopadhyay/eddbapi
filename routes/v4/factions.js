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

const express = require('express');
const _ = require('lodash');

let router = express.Router();

/**
 * @swagger
 * /factions:
 *   get:
 *     description: Get the Factions
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: eddbid
 *         description: EDDB ID.
 *         in: query
 *         type: integer
 *       - name: name
 *         description: Faction name.
 *         in: query
 *         type: string
 *       - name: allegiancename
 *         description: Name of the allegiance.
 *         in: query
 *         type: string
 *       - name: governmentname
 *         description: Name of the government type.
 *         in: query
 *         type: string
 *       - name: playerfaction
 *         description: Whether the faction is a player faction.
 *         in: query
 *         type: boolean
 *       - name: power
 *         description: Name of the power in influence in a system the faction is in.
 *         in: query
 *         type: string
 *       - name: homesystemname
 *         description: Name of the home system of the faction.
 *         in: query
 *         type: string
 *       - name: page
 *         description: Page no of response.
 *         in: query
 *         type: integer
 *     responses:
 *       200:
 *         description: An array of factions in EDDB format
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/FactionsPage'
 */
router.get('/', async (req, res, next) => {
    try {
        let factions = require('../../models/factions');
        let query = {};
        let systemSearch;
        let page = 1;

        if (req.query.eddbid) {
            query.id = req.query.eddbid;
        }
        if (req.query.name) {
            query.name_lower = req.query.name.toLowerCase();
        }
        if (req.query.allegiancename) {
            query.allegiance = req.query.allegiancename.toLowerCase();
        }
        if (req.query.governmentname) {
            query.government = req.query.governmentname.toLowerCase();
        }
        if (req.query.playerfaction) {
            query.is_player_faction = boolify(req.query.playerfaction);
        }
        if (req.query.page) {
            page = req.query.page;
        }
        if (req.query.homesystemname || req.query.power) {
            systemSearch = async () => {
                let systems = require('../../models/systems');
                let systemQuery = {};

                if (req.query.homesystemname) {
                    systemQuery.name_lower = req.query.homesystemname.toLowerCase();
                }
                if (req.query.power) {
                    systemQuery.power = req.query.power.toLowerCase();
                }
                let systemProjection = {
                    _id: 0,
                    id: 1
                }
                let result = await systems.find(systemQuery, systemProjection).lean()
                let ids = [];
                result.forEach(doc => {
                    ids.push(doc.id);
                }, this);
                return ids;
            }
        }

        let factionSearch = async () => {
            if (_.isEmpty(query)) {
                throw new Error("Add at least 1 query parameter to limit traffic");
            }
            let paginateOptions = {
                lean: true,
                page: page,
                limit: 10,
                leanWithId: false
            };
            let result = await factions.paginate(query, paginateOptions)
            res.status(200).json(result);
        }

        if (systemSearch) {
            let ids = await systemSearch();
            query.home_system_id = { $in: ids };
            factionSearch();
        } else {
            factionSearch();
        }
    } catch (err) {
        next(err);
    }
});

let boolify = requestParam => {
    if (requestParam.toLowerCase() === "true") {
        return true;
    } else if (requestParam.toLowerCase() === "false") {
        return false;
    } else {
        return false;
    }
}

module.exports = router;

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

const path = require('path');
const fs = require('fs');
const systemsModel = require('../../models/systems');
const utilities = require('../utilities');
const eventEmmiter = require('events').EventEmitter;
const inherits = require('util').inherits;

let fileSize = require('../utilities/file_size');

module.exports = Systems;

const pathToFile = path.resolve(__dirname, '../../dumps/systems.csv');

function Systems() {
    eventEmmiter.call(this);

    this.update = function () {
        let recordsUpdated = 0;
        let stream = utilities.csvToJson(pathToFile);
        stream
            .on('start', () => {
                console.log(`EDDB system dump update reported`);
                this.emit('started', {
                    statusCode: 200,
                    update: "started",
                    type: 'system'
                });
            })
            .on('data', async json => {
                stream.pause();
                try {
                    await systemsModel.findOneAndUpdate(
                        {
                            id: json.id,
                            updated_at: { $ne: json.updated_at }
                        },
                        json,
                        {
                            upsert: true,
                            runValidators: true
                        })
                    recordsUpdated++;
                } catch (err) {
                    this.emit('error', err);
                } finally {
                    stream.resume();
                }
            })
            .on('end', () => {
                console.log(`${recordsUpdated} records updated`);
                fs.unlink(pathToFile, () => {
                    console.log('System Dump deleted');
                });
                this.emit('done', recordsUpdated);
            })
            .on('error', err => {
                this.emit('error', err);
            })
    };

    this.import = function () {
        let recordsInserted = 0;
        let stream = utilities.csvToJson(pathToFile);
        stream
            .on('start', () => {
                console.log(`EDDB system dump insertion reported`);
                this.emit('started', {
                    statusCode: 200,
                    insertion: "started",
                    type: 'system'
                });
            })
            .on('data', async json => {
                stream.pause();
                try {
                    let document = new systemsModel(json);
                    await document.save()
                    recordsInserted++;
                } catch (err) {
                    this.emit('error', err);
                } finally {
                    stream.resume();
                }
            })
            .on('end', () => {
                console.log(`${recordsInserted} records inserted`);
                fs.unlink(pathToFile, () => {
                    console.log('System Dump deleted');
                });
                this.emit('done', recordsInserted);
            })
            .on('error', err => {
                this.emit('error', err);
            })
    };

    this.download = function () {
        utilities.download('https://eddb.io/archive/v6/systems.csv', pathToFile)
            .on('start', response => {
                console.log(`EDDB system dump reported with status code ${response.statusCode}`);
                this.emit('started', {
                    response: response,
                    insertion: "started",
                    type: 'system'
                });
            })
            .on('end', () => {
                console.log(`EDDB system dump saved successfully with file size ${fileSize.withPath(pathToFile)}`)
                this.emit('done');
            })
            .on('error', err => {
                this.emit('error', err);
            })
    }

    this.downloadUpdate = function () {
        let recordsUpdated = 0;
        let stream = utilities.downloadUpdate('https://eddb.io/archive/v6/systems.csv', 'csv');
        stream
            .on('start', response => {
                console.log(`EDDB system dump started with status code ${response.statusCode}`);
                this.emit('started', {
                    response: response,
                    insertion: "started",
                    type: 'station'
                });
            })
            .on('data', async json => {
                stream.pause();
                try {
                    await systemsModel.findOneAndUpdate(
                        {
                            id: json.id,
                            updated_at: { $ne: json.updated_at }
                        },
                        json,
                        {
                            upsert: true,
                            runValidators: true
                        });
                    recordsUpdated++;
                } catch (err) {
                    this.emit('error', err);
                } finally {
                    stream.resume();
                }
            })
            .on('end', () => {
                console.log(`${recordsUpdated} records updated`);
                this.emit('done', recordsUpdated);
            })
            .on('error', err => {
                this.emit('error', err);
            })
    }
}

inherits(Systems, eventEmmiter);

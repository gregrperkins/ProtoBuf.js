/*
 Copyright 2013 Daniel Wirtz <dcode@dcode.io>

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/**
 * @license ProtoBuf.js (c) 2013 Daniel Wirtz <dcode@dcode.io>
 * Released under the Apache License, Version 2.0
 * see: https://github.com/dcodeIO/ProtoBuf.js for details
 */
(function(global) {
    "use strict";
    
    function loadProtoBuf(ByteBuffer) {
        if (!ByteBuffer || !ByteBuffer.calculateUTF8String || !ByteBuffer.zigZagEncode32) {
            // Usually not neccessary, but to be sure...
            if (typeof dcodeIO != 'undefined' && dcodeIO.ByteBuffer) {
                ByteBuffer = dcodeIO.ByteBuffer;
            }
            if (!ByteBuffer && typeof require == 'function') {
                ByteBuffer = require("ByteBuffer");
            }
            if (!ByteBuffer) throw(new Error("ProtoBuf.js requires ByteBuffer.js >=1.1.0: Get it at https://github.com/dcodeIO/ByteBuffer.js"));
        }

        /**
         * The ProtoBuf namespace.
         * @exports ProtoBuf
         * @namespace
         * @expose
         */
        var ProtoBuf = {};
        
        /**
         * ProtoBuf.js version.
         * @type {string}
         * @const
         * @expose
         */
        ProtoBuf.VERSION = // #put '"'+VERSION+'";'

        /**
         * Wire types.
         * @type {Object.<string,number>}
         * @const
         * @expose
         */
        ProtoBuf.WIRE_TYPES = {};

        /**
         * Varint wire type.
         * @type {number}
         * @expose
         */
        ProtoBuf.WIRE_TYPES.VARINT = 0;

        /**
         * Fixed 64 bits wire type.
         * @type {number}
         * @const
         * @expose
         */
        ProtoBuf.WIRE_TYPES.BITS64 = 1;

        /**
         * Length delimited wire type.
         * @type {number}
         * @const
         * @expose
         */
        ProtoBuf.WIRE_TYPES.LDELIM = 2;

        /**
         * Start group wire type.
         * @type {number}
         * @const
         * @deprecated Not supported.
         * @expose
         */
        ProtoBuf.WIRE_TYPES.STARTGROUP = 3;

        /**
         * End group wire type.
         * @type {number}
         * @const
         * @deprecated Not supported.
         * @expose
         */
        ProtoBuf.WIRE_TYPES.ENDGROUP = 4;

        /**
         * Fixed 32 bits wire type.
         * @type {number}
         * @const
         * @expose
         */
        ProtoBuf.WIRE_TYPES.BITS32 = 5;

        /**
         * Types.
         * @dict
         * @type {Object.<string,{name: string, wireType: number}>}
         * @const
         * @expose
         */
        ProtoBuf.TYPES = {
            // According to the protobuf spec.
            "int32": {
                name: "int32",
                wireType: ProtoBuf.WIRE_TYPES.VARINT
            },
            "uint32": {
                name: "uint32",
                wireType: ProtoBuf.WIRE_TYPES.VARINT
            },
            "sint32": {
                name: "sint32",
                wireType: ProtoBuf.WIRE_TYPES.VARINT
            },
            "bool": {
                name: "bool",
                wireType: ProtoBuf.WIRE_TYPES.VARINT
            },
            "double": {
                name: "double",
                wireType: ProtoBuf.WIRE_TYPES.BITS64
            },
            "string": {
                name: "string",
                wireType: ProtoBuf.WIRE_TYPES.LDELIM
            },
            "bytes": {
                name: "bytes",
                wireType: ProtoBuf.WIRE_TYPES.LDELIM
            },
            "fixed32": {
                name: "fixed32",
                wireType: ProtoBuf.WIRE_TYPES.BITS32
            },
            "sfixed32": {
                name: "sfixed32",
                wireType: ProtoBuf.WIRE_TYPES.BITS32
            },
            "sfixed64": {
                name: "sfixed64",
                wireType: ProtoBuf.WIRE_TYPES.BITS64
            },
            "float": {
                name: "float",
                wireType: ProtoBuf.WIRE_TYPES.BITS32
            },
            "enum": {
                name: "enum",
                wireType: ProtoBuf.WIRE_TYPES.VARINT
            },
            "message": {
                name: "message",
                wireType: ProtoBuf.WIRE_TYPES.LDELIM
            }
        };

        /**
         * @type {?Long}
         */
        ProtoBuf.Long = ByteBuffer.Long;
        
        // #include "ProtoBuf/Util.js"
        
        // #include "ProtoBuf/Lang.js"
        
        // #ifndef NOPARSE
        // #include "ProtoBuf/DotProto.js"
        
        // #include "ProtoBuf/DotProto/Tokenizer.js"
        
        // #include "ProtoBuf/DotProto/Parser.js"
        
        // #else
        // This build of ProtoBuf.js does not include DotProto support.
        
        // #endif
        // #include "ProtoBuf/Reflect.js"
        
        // #include "ProtoBuf/Builder.js"
        
        /**
         * Builds a .proto definition and returns the Builder.
         * @param {string} proto .proto file contents
         * @param {ProtoBuf.Builder=} builder Builder to append to. Will create a new one if omitted.
         * @return {ProtoBuf.Builder} Builder to create new messages
         * @throws {Error} If the definition cannot be parsed or built
         * @expose
         */
        ProtoBuf.protoFromString = function(proto, builder) {
            // #ifdef NOPARSE
            throw(new Error("This build of ProtoBuf.js does not include DotProto support. See: https://github.com/dcodeIO/ProtoBuf.js"));
            // #else
            var parser = new ProtoBuf.DotProto.Parser(proto+"");
            var parsed = parser.parse();
            var builder = typeof builder == 'object' ? builder : new ProtoBuf.Builder();
            if (parsed['package'] !== null) {
                builder.define(parsed['package']); // Define the package
            }
            builder.create(parsed['messages']); // Create the messages
            builder.reset();
            builder.resolveAll();
            builder.build();
            return builder;
            // #endif
        };

        /**
         * Builds a .proto file and returns the Builder.
         * @param {string} filename Path to proto filename
         * @param {function(ProtoBuf.Builder)=} callback Callback that will receive the Builder as its first argument.
         *   If the request has failed, builder will be NULL. If omitted, the file will be read synchronously and this
         *   function will return the Builder or NULL if the request has failed.
         * @param {ProtoBuf.Builder=} builder Builder to append to. Will create a new one if omitted.
         * @return {?ProtoBuf.Builder|undefined} The Builder if synchronous (no callback specified, will be NULL if the
         *   request has failed), else undefined
         * @expose
         */
        ProtoBuf.protoFromFile = function(filename, callback, builder) {
            if (callback && typeof callback == 'object') {
                builder = callback;
                callback = null;
            } else if (!callback || typeof callback != 'function') {
                callback = null;
            }
            if (callback) {
                ProtoBuf.Util.fetch(filename, function(contents) {
                    callback(ProtoBuf.protoFromString(contents, builder));
                });
            } else {
                var contents = ProtoBuf.Util.fetch(filename);
                return contents !== null ? ProtoBuf.protoFromString(contents, builder) : null;
            }
        };

        /**
         * Constructs a new Builder with the specified package defined.
         * @param {string=} pkg Package name as fully qualified name, e.g. "My.Game". If no package is specified, the
         * builder will only contain a global namespace.
         * @return {ProtoBuf.Builder} New Builder
         * @expose
         */
        ProtoBuf.newBuilder = function(pkg) {
            var builder = new ProtoBuf.Builder();
            if (typeof pkg != 'undefined') {
                builder.define(pkg);
            }
            return builder;
        };

        return ProtoBuf;
    }

    // Enable module loading if available
    if (typeof module != 'undefined' && module["exports"]) { // CommonJS
        module["exports"] = loadProtoBuf(require("bytebuffer"));
    } else if (typeof define != 'undefined' && define["amd"]) { // AMD
        define("ProtoBuf", ["ByteBuffer"], loadProtoBuf);
    } else { // Shim
        if (!global["dcodeIO"]) {
            global["dcodeIO"] = {};
        }
        global["dcodeIO"]["ProtoBuf"] = loadProtoBuf(global["dcodeIO"]["ByteBuffer"]);
    }

})(this);
exports.requestLogger = ( tokens, req, res ) => {
  return `\n${ new Date().toUTCString() } -- ${ req.method } ${ req.originalUrl } ${ res.statusCode } ${ tokens[ 'response-time' ]( req, res ) } ms \n`;
};
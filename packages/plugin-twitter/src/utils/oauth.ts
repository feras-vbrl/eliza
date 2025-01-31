import crypto from 'crypto';

/**
 * Percent encode string according to Twitter's requirements
 */
function percentEncode(str: string): string {
    return encodeURIComponent(str)
        .replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A')
        .replace(/%20/g, '%2520');
}

/**
 * Generate OAuth 1.0a signature
 */
function generateSignature(
    method: string,
    baseUrl: string,
    params: Record<string, string>,
    consumerSecret: string,
    tokenSecret: string
): string {
    // Sort parameters
    const paramString = Object.keys(params)
        .filter(key => key !== 'media_data') // Exclude media data from signature
        .sort()
        .map(key => `${percentEncode(key)}=${percentEncode(params[key])}`)
        .join('&');

    // Create signature base string
    const signatureBaseString = [
        method.toUpperCase(),
        percentEncode(baseUrl),
        percentEncode(paramString)
    ].join('&');

    // Create signing key
    const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;

    // Generate signature
    return crypto
        .createHmac('sha1', signingKey)
        .update(signatureBaseString)
        .digest('base64');
}

/**
 * Generate OAuth 1.0a authorization header
 */
export function generateAuthHeader(
    method: string,
    url: string,
    params: Record<string, string>,
    apiKey: string,
    apiSecret: string,
    accessToken: string,
    accessTokenSecret: string
): string {
    // Generate random nonce
    const nonce = crypto.randomBytes(32)
        .toString('base64')
        .replace(/[^a-zA-Z0-9]/g, '');

    // Create OAuth parameters
    const oauthParams = {
        oauth_consumer_key: apiKey,
        oauth_nonce: nonce,
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
        oauth_token: accessToken,
        oauth_version: '1.0'
    };

    // Combine all parameters for signature
    const allParams = { ...params };

    // Handle media_data separately
    const hasMediaData = 'media_data' in allParams;
    const mediaData = hasMediaData ? allParams['media_data'] : null;
    if (hasMediaData) {
        delete allParams['media_data'];
    }

    // Generate signature
    const signature = generateSignature(
        method,
        url,
        { ...allParams, ...oauthParams },
        apiSecret,
        accessTokenSecret
    );

    // Build authorization header string exactly as Twitter requires
    const headerParams = [
        ['oauth_consumer_key', apiKey],
        ['oauth_nonce', nonce],
        ['oauth_signature', signature],
        ['oauth_signature_method', 'HMAC-SHA1'],
        ['oauth_timestamp', oauthParams.oauth_timestamp],
        ['oauth_token', accessToken],
        ['oauth_version', '1.0']
    ];

    const headerString = headerParams
        .map(([key, value]) => `${percentEncode(key)}="${percentEncode(value)}"`)
        .join(', ');

    return `OAuth ${headerString}`;
}
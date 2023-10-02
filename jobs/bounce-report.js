// eslint-disable-next-line import/no-unassigned-import
require('#config/env');

const process = require('node:process');
const zlib = require('node:zlib');
const { Buffer } = require('node:buffer');
const { parentPort } = require('node:worker_threads');

// eslint-disable-next-line import/no-unassigned-import
require('#config/mongoose');

const Graceful = require('@ladjs/graceful');
const dayjs = require('dayjs-with-plugins');
const mongoose = require('mongoose');
const parseErr = require('parse-err');

const config = require('#config');
const emailHelper = require('#helpers/email');
const setupMongoose = require('#helpers/setup-mongoose');
const logger = require('#helpers/logger');
const getLogsCsv = require('#helpers/get-logs-csv');

const graceful = new Graceful({
  mongooses: [mongoose],
  logger
});

graceful.listen();

(async () => {
  await setupMongoose(logger);

  try {
    //
    // NOTE: we use async iterator (cursor) for performance
    // <https://mongoosejs.com/docs/api/querycursor.html#querycursor_QueryCursor-Symbol.asyncIterator>
    // <https://thecodebarbarian.com/whats-new-in-mongoose-53-async-iterators.html
    //
    const now = new Date();

    const { count, csv, set, message } = await getLogsCsv(now, {
      created_at: {
        $gte: dayjs(now).subtract(4, 'hour').toDate(),
        $lte: now
      }
    });

    // email the spreadsheet to admins
    await emailHelper({
      template: 'alert',
      message: {
        to: config.email.message.from,
        subject: `(${count}) Email Deliverability Logs for ${dayjs(now).format(
          'M/D/YY h:mm A z'
        )} (${set.size} trusted hosts blocked)`,
        attachments: [
          {
            filename: `email-deliverability-logs-${dayjs(now).format(
              'YYYY-MM-DD-h-mm-A-z'
            )}.csv.gz`.toLowerCase(),
            content: zlib.gzipSync(Buffer.from(csv, 'utf8'), {
              level: 9
            })
          }
        ]
      },
      locals: {
        message
      }
    });
  } catch (err) {
    await logger.error(err);
    // send an email to admins of the error
    await emailHelper({
      template: 'alert',
      message: {
        to: config.email.message.from,
        subject: 'Email Deliverability Report Issue'
      },
      locals: {
        message: `<pre><code>${JSON.stringify(
          parseErr(err),
          null,
          2
        )}</code></pre>`
      }
    });
  }

  if (parentPort) parentPort.postMessage('done');
  else process.exit(0);
})();

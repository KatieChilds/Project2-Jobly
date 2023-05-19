"use strict";

const db = require("../db");
const {
  BadRequestError,
  NotFoundError,
} = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle}
   *
   *
   * */

  static async create({
    title,
    salary,
    equity,
    companyHandle,
  }) {
    const result = await db.query(
      `INSERT INTO jobs (title, salary, equity, company_handle)
        VALUES($1, $2, $3, $4)
        RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [title, salary, equity, companyHandle]
    );

    const job = result.rows[0];
    return job;
  }

  /** Find all jobs.
   *
   * Returns [{id, title, salary, equity, companyHandle}, ...]
   */
  static async findAll() {
    const jobsRes = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs`
    );

    return jobsRes.rows;
  }

  /** Filter job results from query string data.
   * Data can include: title, minSalary and/or hasEquity
   *
   * Not all fields required.
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   *
   */
  static async filter(data) {
    let queryWhere = [];
    // If filtering by title
    if (data.title) {
      queryWhere.push(`title ILIKE '%${data.title}%'`);
    }
    // If filtering by minSalary
    if (data.minSalary) {
      queryWhere.push(`salary >= ${data.minSalary}`);
    }
    // If filtering by hasEquity
    if (data.hasEquity === "true") {
      queryWhere.push(`equity > 0`);
    }
    // Build required SQL query and execute to return array of jobs matching filter criteria
    if (queryWhere.length > 1) {
      const whereClause = queryWhere.join(" AND ");
      console.log("WHERE CLAUSE", whereClause);
      const sqlQuery = `SELECT id,
                               title,
                               salary,
                               equity,
                               company_handle AS "companyHandle"
                        FROM jobs
                        WHERE ${whereClause}`;
      const result = await db.query(sqlQuery);
      const jobs = result.rows;
      return jobs;
    } else if (queryWhere.length === 0) {
      const jobs = Job.findAll();
      return jobs;
    } else {
      const querySql = `SELECT id,
                               title,
                               salary,
                               equity,
                               company_handle AS "companyHandle"
                        FROM jobs
                        WHERE ${queryWhere[0]}`;

      const result = await db.query(querySql);
      const jobs = result.rows;
      return jobs;
    }
  }

  /** Given a job id, return data about the job.
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   **/
  static async get(id) {
    const jobRes = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs WHERE id = $1`,
      [id]
    );

    const job = jobRes.rows[0];

    if (!job) {
      throw new NotFoundError(`No Job: ${id}`);
    }

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */
  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      companyHandle: "company_handle",
    });

    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${handleVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [
      ...values,
      id,
    ]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No Job: ${id}`);

    return job;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/
  static async remove(id) {
    const result = await db.query(
      `DELETE FROM jobs WHERE id = $1 RETURNING id`,
      [id]
    );

    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No Job: ${id}`);
  }
}

module.exports = Job;

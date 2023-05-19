"use strict";

const db = require("../db");
const {
  BadRequestError,
  NotFoundError,
} = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({
    handle,
    name,
    description,
    numEmployees,
    logoUrl,
  }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(
        `Duplicate company: ${handle}`
      );

    const result = await db.query(
      `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [handle, name, description, numEmployees, logoUrl]
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll() {
    const companiesRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`
    );
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT c.handle,
                  c.name,
                  c.description,
                  c.num_employees AS "numEmployees",
                  c.logo_url AS "logoUrl",
                  j.id,
                  j.title,
                  j.salary,
                  j.equity
           FROM companies AS c
           LEFT JOIN jobs AS j
           ON c.handle = j.company_handle
           WHERE handle = $1`,
      [handle]
    );

    if (companyRes.rows.length === 0) {
      throw new NotFoundError(`No company: ${handle}`);
    }

    const { name, description, numEmployees, logoUrl } =
      companyRes.rows[0];

    let jobs = companyRes.rows.map(function (r) {
      return {
        id: r.id,
        title: r.title,
        salary: r.salary,
        equity: r.equity,
      };
    });

    if (jobs[0].id === null) {
      jobs = [null];
    }
    const company = {
      handle,
      name,
      description,
      numEmployees,
      logoUrl,
      jobs,
    };
    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      numEmployees: "num_employees",
      logoUrl: "logo_url",
    });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [
      ...values,
      handle,
    ]);
    const company = result.rows[0];

    if (!company)
      throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Filter company results from query string data.
   * Data can include: name, minEmployees and/or maxEmployees
   *
   * Not all fields required.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   *
   * Throws BadRquestError if minEmployees > maxEmployees
   */
  static async filter(data) {
    let queryWhere = [];
    // If filtering by name
    if (data.name) {
      queryWhere.push(`name ILIKE '%${data.name}%'`);
    }
    // If filtering by min or max Employees
    if (data.minEmployees && data.maxEmployees) {
      // Check if min > max
      if (+data.minEmployees > +data.maxEmployees) {
        throw new BadRequestError(
          "minEmployees cannot be greater than maxEmployees"
        );
      } else {
        queryWhere.push(
          `num_employees BETWEEN ${data.minEmployees} AND ${data.maxEmployees}`
        );
      }
    } else if (data.minEmployees) {
      queryWhere.push(
        `num_employees >= ${data.minEmployees}`
      );
    } else if (data.maxEmployees) {
      queryWhere.push(
        `num_employees <= ${data.maxEmployees}`
      );
    }
    // Build required SQL query and execute to return array of companies matching filter criteria
    if (queryWhere.length > 1) {
      const whereClause = queryWhere.join("AND ");
      const sqlQuery = `SELECT handle,
                               name,
                               description,
                               num_employees AS "numEmployees",
                               logo_url AS "logoUrl"
                        FROM companies
                        WHERE ${whereClause}
                        ORDER BY name`;
      const result = await db.query(sqlQuery);
      const companies = result.rows;
      return companies;
    } else {
      const querySql = `SELECT handle,
                               name,
                               description,
                               num_employees AS "numEmployees",
                               logo_url AS "logoUrl"
                        FROM companies
                        WHERE ${queryWhere[0]}
                        ORDER BY name`;

      const result = await db.query(querySql);
      const companies = result.rows;
      return companies;
    }
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]
    );
    const company = result.rows[0];

    if (!company)
      throw new NotFoundError(`No company: ${handle}`);
  }
}

module.exports = Company;
